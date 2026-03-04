from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, computed_field
from typing import List,Optional 
import os
from dotenv import load_dotenv
load_dotenv()
app = FastAPI()

#DATABASE SETUP & MODELS
DB_USER = "postgres"
DB_PASSWORD = os.getenv("DB_PASSWORD")
ENDPOINT = os.getenv("ENDPOINT")
DB_NAME = os.getenv("DB_NAME")

DATABASE_URL =  f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{ENDPOINT}:5432/{DB_NAME}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "UserInfo"
    email = Column(String(100), primary_key=True, nullable=False) 
    github_pat = Column(String(255), nullable=False)  
    password = Column(String(100), nullable=False)   
    experience_lvl = Column(String(20), nullable=False) 

class Organization(Base):
    __tablename__ = "Organizations"
    id = Column(Integer, primary_key=True,index = True)
    github_link = Column(String(100), unique = True,nullable = False)
    web_url = Column(String(500))
    tech_stack = Column(String(225),nullable=False)
    name = Column(String,nullable=False, unique=True)

Base.metadata.create_all(bind=engine) 

def create_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ZONE 2: PYDANTIC SCHEMAS

class UserResponse(BaseModel):
    email: str
    raw_pat: str = "" 
    experience_lvl: str
    
    @computed_field
    def three_chara(self) -> str:
         if self.raw_pat:
            return f"{self.raw_pat[:3]}"
         else:
            return "Not set"

    class Config:
        from_attributes = True

class ExperienceUpdate(BaseModel):
    experience_lvl: str

class OrgCreate(BaseModel):
    github_link:str
    web_url:str
    tech_stack:str
    name:str

# API ROUTES
@app.get('/')
def read_root():
    return {'Hello': 'Amazon Nova'}

@app.post("/user/signup", response_model=UserResponse)
def signup(email: str, pat: str, password: str, level: str, db: Session = Depends(create_db)):
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email Already Registered")
        
    new_user = User(email=email, github_pat=pat, password=password, experience_lvl=level)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    response = UserResponse.model_validate(new_user)
    response.raw_pat = pat
    return response

@app.post("/user/login")
def login(email: str, password: str, db: Session = Depends(create_db)):
    user = db.query(User).filter(User.email == email).first()

    if not user or user.password != password:
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    return {"message": "Login Successful", "email": user.email}

@app.put("/user/{email}/experience")
def updated_exp(email: str, updated_data: ExperienceUpdate, db: Session = Depends(create_db)): 
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User Not Found")
        
    user.experience_lvl = updated_data.experience_lvl
    
    db.commit()
    db.refresh(user)
    
    return {
        "message": "Experience level updated successfully!",
        "current_level": user.experience_lvl
    }

