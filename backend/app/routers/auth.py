from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import requests
import os
import bcrypt
import models as models
import app.schemas as schemas
from database import get_db

routes = APIRouter(prefix="/user", tags=["Authentication"])


# ─── Helper functions ────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        # Fallback: if the stored password isn't a bcrypt hash (legacy plaintext), do direct comparison
        return plain_password == hashed_password


# ─── Signup ──────────────────────────────────────────────────────────

@routes.post("/signup", response_model=schemas.SignupResponse)
def signup(email: str, pat: str, password: str, level: str, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email Already Registered")
    
    hashed_pw = hash_password(password)
    
    new_user = models.User(
        email=email,
        github_pat=pat if pat else None,
        password=hashed_pw,
        experience_lvl=level,
        auth_type="email"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return schemas.SignupResponse(
        message="Account created successfully",
        email=new_user.email,
        has_pat=bool(new_user.github_pat),
        experience_level=new_user.experience_lvl,
        auth_type="email"
    )


# ─── Email Login ─────────────────────────────────────────────────────

@routes.post("/login", response_model=schemas.LoginResponse)
def login(email: str, password: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    return schemas.LoginResponse(
        message="Login Successful",
        email=user.email,
        has_pat=bool(user.github_pat),
        experience_level=user.experience_lvl,
        auth_type=user.auth_type or "email",
        github_username=user.github_username
    )


# ─── Google Login ────────────────────────────────────────────────────

@routes.post("/google-login", response_model=schemas.LoginResponse)
def google_login(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
        
    token = auth_header.split(" ")[1]
    
    # Verify Firebase ID token via Google Identity Toolkit API
    api_key = os.getenv("FIREBASE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Firebase API key not configured")
    
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={api_key}"
    resp = requests.post(url, json={"idToken": token})
    
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Firebase token")
        
    data = resp.json()
    users = data.get("users", [])
    if not users:
        raise HTTPException(status_code=401, detail="User not found in token")
        
    email = users[0].get("email")
    if not email:
        raise HTTPException(status_code=400, detail="No email associated with this Google account")
        
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        # Auto-create user for Google sign-in
        new_user = models.User(
            email=email, 
            github_pat=None, 
            password="oauth_managed",  # Not used for Google auth
            experience_lvl="Intermediate",
            auth_type="google"
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return schemas.LoginResponse(
            message="Login Successful",
            email=email,
            has_pat=False,
            experience_level="Intermediate",
            auth_type="google",
            github_username=None
        )
    
    return schemas.LoginResponse(
        message="Login Successful",
        email=email,
        has_pat=bool(user.github_pat),
        experience_level=user.experience_lvl,
        auth_type=user.auth_type or "google",
        github_username=user.github_username
    )


# ─── Update Experience Level ─────────────────────────────────────────

@routes.put("/{email}/experience")
def updated_exp(email: str, updated_data: schemas.ExperienceUpdate, db: Session = Depends(get_db)): 
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User Not Found")
        
    user.experience_lvl = updated_data.experience_lvl
    db.commit()
    db.refresh(user)
    
    return {
        "message": "Experience level updated successfully!",
        "current_level": user.experience_lvl
    }


# ─── Save PAT (legacy, prefer /validate-pat instead) ────────────────

@routes.put("/save-pat")
def save_pat(pat_data: schemas.PATUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == pat_data.email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User Not Found")
        
    user.github_pat = pat_data.pat
    db.commit()
    
    return {"message": "GitHub PAT securely linked to your account!"}