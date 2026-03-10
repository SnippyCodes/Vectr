#this is a blueprint file for SQL ALCHEMY

from sqlalchemy import Column, String, Integer, ForeignKey
from database import Base

class User(Base):
    __tablename__ = "UserInfo"
    email = Column(String(100), primary_key=True, nullable=False) 
    github_pat = Column(String(500), nullable=True)  # Encrypted PATs are longer
    password = Column(String(255), nullable=False)    # bcrypt hashes are ~60 chars
    experience_lvl = Column(String(20), nullable=False)
    github_username = Column(String(100), nullable=True)
    auth_type = Column(String(20), nullable=False, default="email")  # "email" or "google"

class Organization(Base):
    __tablename__ = "Organizations"
    id = Column(Integer, primary_key=True,index = True)
    github_link = Column(String(100), unique = True,nullable = False)
    web_url = Column(String(500))
    tech_stack = Column(String(225),nullable=False)
    name = Column(String,nullable=False, unique=True)

class Contributions(Base):
    __tablename__ = "Contributions"
    id = Column(Integer,primary_key=True,index=True)
    repo_name = Column(String,nullable=False)
    issue_title = Column(String,nullable=False)
    language = Column(String)
    issue_number = Column(Integer,nullable=False)
    user_email = Column(String, ForeignKey("UserInfo.email"))
    status = Column(String)
