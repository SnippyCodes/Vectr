from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware #To prevent Network Error 
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Initialize the rate limiter (tracks by user IP address)
limiter = Limiter(key_func=get_remote_address)

from app.routers import auth,dashboard,PAT_auth,contribution_flow,repos,ask_nova, repo, progress
#TO import Local Modules 
import models


from database import engine
try:
    models.Base.metadata.create_all(bind=engine)
except Exception:
    pass  # Already handled in database.py

app = FastAPI()

# Register the limiter to the FastAPI app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = [
    "https://vectoropensource.me",
    "https://www.vectoropensource.me",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

#Plugin in the routers
app.include_router(auth.routes)
app.include_router(dashboard.routes)
app.include_router(PAT_auth.routes)
app.include_router(contribution_flow.routes)
app.include_router(repos.routes)
app.include_router(ask_nova.routes)
app.include_router(repo.router)
app.include_router(progress.routes)

# API ROUTES
@app.get('/')
def read_root():
    return {'Hello': 'Amazon Nova'}

# Apply the rate limit to an endpoint (e.g., 5 requests per minute)
@app.get("/api/heavy-computation")
@limiter.limit("5/minute")
async def heavy_computation(request: Request):
    return {"message": "Success!"}
