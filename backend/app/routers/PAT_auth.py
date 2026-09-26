from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
import requests
import os
import models as models
import app.schemas as schemas
from database import get_db
from app.utils.encryption import encrypt_pat

routes = APIRouter(prefix="/user", tags=["Validation"])
    
@routes.post("/validate-pat")
def validate_and_save_pat(pat_data: schemas.PATUpdate, db: Session = Depends(get_db)):
    token = pat_data.pat.strip()
    email = pat_data.email.strip().lower()

    if not email:
        raise HTTPException(status_code=400, detail="User email is required.")

    # 1. Validate the GitHub PAT
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Vectr-App"
    }
    
    try:
        res = requests.get("https://api.github.com/user", headers=headers, timeout=15)
        res.raise_for_status()
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid GitHub PAT. Please check token permissions.")
        elif e.response.status_code == 403:
            raise HTTPException(status_code=403, detail="GitHub API rate limit exceeded or access forbidden.")
        raise HTTPException(status_code=e.response.status_code, detail="Failed to connect to GitHub.")
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=504, detail="GitHub connection timed out. Please try again.")
        
    # 2. Save Encrypted PAT to the User database (Auto-provision if user record missing)
    encrypted_pat = encrypt_pat(token)
    user = db.query(models.User).filter(func.lower(models.User.email) == email).first()
    
    if not user:
        user = models.User(
            email=email,
            github_pat=encrypted_pat,
            password="oauth_or_pat_managed",
            experience_lvl="Intermediate"
        )
        db.add(user)
    else:
        user.github_pat = encrypted_pat
        
    db.commit()
    db.refresh(user)
    
    github_user = res.json()
    
    return {
        "message": "GitHub PAT validated and saved successfully",
        "github_username": github_user.get("login")
    }
