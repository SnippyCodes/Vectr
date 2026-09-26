from dotenv import load_dotenv
from pathlib import Path
backend_env = Path(__file__).resolve().parent.parent / '.env'
if backend_env.exists():
    load_dotenv(dotenv_path=backend_env)
load_dotenv()

from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware #To prevent Network Error 
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.limiter import limiter

from app.routers import auth,dashboard,PAT_auth,contribution_flow,repos,ask_nova, progress
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

# CORS: production domains only
# Never use "*" with allow_credentials=True - it's a security hole
# that lets any website make authenticated API calls using a visitor's cookies
origins = [
    "https://vectropensource.me",
    "https://www.vectropensource.me",
    "https://vectoropensource.me",
    "https://www.vectoropensource.me",
    "http://localhost:5173",   # local dev only
    "http://127.0.0.1:5173",  # local dev only
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
app.include_router(progress.routes)

# API ROUTES
@app.get('/')
def read_root():
    return {'Hello': 'Amazon Nova'}

@app.get('/health')
def health_check():
    return {'status': 'healthy', 'service': 'Vectr API', 'version': '1.0.0'}
