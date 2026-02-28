from fastapi import FastAPI,Depends,HTTPException
from sqlalchemy import create_engine,Column,Integer,String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker,Session


from pydantic import BaseModel,computed_field
from typing import  Optional,List   

app = FastAPI()


#Database Setup
engine = create_engine("sqlite:///./database.db", connect_args={"check_same_thread":False})
SessionLocal = sessionmaker(autocommit = False,autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "UserInfo"
    email = Column(String(100), primary_key=True, nullable=False)
    github_pat = Column(String(255), nullable=True) # Optional for OAuth users
    password = Column(String(100), nullable=True) # Optional for OAuth users
    experience_lvl = Column(String(20), nullable=True, default="Beginner")
    oauth_provider = Column(String(50), nullable=True) # e.g., 'google', 'github'
    oauth_id = Column(String(100), nullable=True) # Provider-specific user ID

Base.metadata.create_all(bind=engine)

class UserResponse(BaseModel):
    email: str
    experience_lvl: str
    oauth_provider: Optional[str] = None
    
    class Config:
        from_attributes = True

class OAuthLoginRequest(BaseModel):
    email: str
    oauth_provider: str
    oauth_id: str
    name: Optional[str] = None

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get('/')
def read_root():
    return {'message': 'Vectr API is running'}

@app.post("/user/signup", response_model=UserResponse)
def signup(email: str, password: str, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(email=email, password=password, experience_lvl="Beginner")
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/user/login", response_model=UserResponse)
def login(email: str, password: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user or user.password != password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return user

@app.post("/user/oauth-login", response_model=UserResponse)
def oauth_login(request: OAuthLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        # Create new user for first-time OAuth login
        user = User(
            email=request.email,
            oauth_provider=request.oauth_provider,
            oauth_id=request.oauth_id,
            experience_lvl="Beginner"
        )
        db.add(user)
    else:
        # Update existing user with OAuth info if not already set
        if not user.oauth_provider:
            user.oauth_provider = request.oauth_provider
            user.oauth_id = request.oauth_id
            
    db.commit()
    db.refresh(user)
    return user
