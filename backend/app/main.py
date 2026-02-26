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
    email = Column(String(100),primary_key=True,nullable=False) #User Email
    github_pat = Column(String(255),nullable=False) #PAT 
    password = Column(String(100),nullable=False)  #User Login-Signup Password 
    experience_lvl = Column(String(20),nullable=False) #Beginner-Intermediate-Expert
Base.metadata.create_all(bind = engine)  #To connect to the engine 




class UserResponse(BaseModel):
    email:str
    raw_pat:str = "" #To store the raw pat for encryption 
    experience_lvl:str
    
    @computed_field
    def three_chara(self) -> str:
         if self.raw_pat:
            return f"{self.raw_pat[:3]}"
         else:
            return "Not set"
         

    class Config:
        from_attributes = True

def create_db():
    db = SessionLocal()
    try:
        yield db
    finally:
            db.close()
create_db()
    

@app.get('/')
def read_root():
    return {'Hello': 'Amazon Nova'}


@app.post("/user/signup",response_model=UserResponse)
def signup(email:str,pat:str,password:str,level:str,db:Session = Depends(create_db)):
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email Already Registered")
    new_user = User(email = email, github_pat = pat, password = password,experience_lvl = level)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    #adds more encryption to the data passed through in the API format
    response = UserResponse.model_validate(new_user)
    response.raw_pat = pat
    return response




@app.post("user/login")
def login(email:str,password:str,db: Session = Depends(create_db)):
    user = db.query(User).filter(User.email == email).first()

    if not user or user.password != password:
        raise HTTPException(status_code=401,detail="Invalid username or password")
        return {"message":"Login Successful","email":user.email}
