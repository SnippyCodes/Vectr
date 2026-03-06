from fastapi import FastAPI, Depends, HTTPException,APIRouter
from fastapi.middleware.cors import CORSMiddleware #To prevent Network Error 
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, computed_field
from typing import List,Optional 
import os
from dotenv import load_dotenv
import requests as rq
load_dotenv()
app = FastAPI()



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  # Allows all headers (like your GitHub PAT)
)


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

# ZONE 2: PYDANTIC SCHEMAS IN THE FOLLOWING ORDER(HOMEPAGE,DASHBOARD)

#For Home Page
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

#What would be shown on Dashboard
class DashboardProject  (BaseModel):
    org_name: str
    project_name: str
    github_link: str
    description: Optional[str] = "No description provided."
    tech_stack: str
    stars: int
    is_good_first_issue_friendly: bool

#What backend sends to frontend
class DashboardResponse(BaseModel):
    user_email: str
    experience_level: str
    primary_language: str #User Selected Programming language
    recommended_projects: List[DashboardProject] #User Selected project


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

#Dashnoaed routes
@app.get("/user/dasboard", response_model = DashboardResponse)
def user_dashboard(email:str, db: Session = Depends(create_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User Not Found")
    if not user.git_pat:
        raise HTTPException(status_code=400,detail="User's Github PAT is missing")
    pat = user.github_pat
    exp_level = user.experience_lvl.lower()
    headers = {
        "Authorization": f"token {pat}",
        "Accept": "application/vnd.github.v3+json"
    }
    try:
        repos_url = "https://api.github.com/user/repos?sort=updated&per_page=15"
        repos_res = rq.get(repos_url, headers=headers)
        repos_res.raise_for_status()

        languages = [repo.get("language") for repo in repos_res.json() if repo.get("language")]
        top_language = max(set(languages), key=languages.count) if languages else "Python"

#Fetches Top 15 Repos from and returns Top5 to the frontend 
        if exp_level == "beginner":
            search_url = f"https://api.github.com/search/repositories?q=language:{top_language}+topic:good-first-issue&sort=stars&order=desc"
        else:
            search_url = f"https://api.github.com/search/repositories?q=language:{top_language}+stars:>1000&sort=updated&order=desc"
    
        #If user is new on Github we choose Python as defalut language 
        languages = [repo.get("language") for repo in repos_res.json() if repo.get("language")]
        
        if not languages:
            top_language = "Python" 
        else:
            top_language = max(set(languages), key=languages.count)
        
        search_res = rq.get(search_url,headers=headers)
        search_res.raise_for_status() #Checks for any unknown errors
        raw_items = search_res.json().get("items", [])[:10] # Grab top 10 results
        recommended_projects = []
        
        for item in raw_items:
            recommended_projects.append(
                DashboardProject(
                    org_name=item["owner"]["login"],
                    project_name=item["name"],
                    github_link=item["html_url"],
                    description=item.get("description"),
                    tech_stack=item.get("language", "Unknown"),
                    stars=item.get("stargazers_count", 0),
                    is_good_first_issue_friendly=(exp_level == "beginner")
                )
            )
        return DashboardResponse(
            user_email=email,
            experience_level=exp_level.capitalize(),
            primary_language=top_language,
            recommended_projects=recommended_projects
        )
    except rq.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid GitHub PAT token. Please update it.")
        raise HTTPException(status_code=e.response.status_code, detail="Failed to fetch data from GitHub.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard error: {str(e)}")
