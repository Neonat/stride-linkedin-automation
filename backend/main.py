from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

app = FastAPI(title="Stride Backend", description="Backend for the Stride Personal Branding OS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELS ---
class LoginRequest(BaseModel):
    username: str
    password: str

class DraftRequest(BaseModel):
    event_description: str
    user_context: dict

class PublishRequest(BaseModel):
    user_urn: str
    post_text: str

# --- ROUTES ---
@app.post("/api/auth/login", tags=["Authentication"])
def login(req: LoginRequest):
    if req.username == "demo" and req.password == "password":
        return {
            "token": "mock-jwt-token-123",
            "user": {
                "name": "Sarah",
                "role": "Product Manager @ TechCorp",
                "streak": 3,
                "pillars": ["Product Strategy", "Women in Tech", "Startup Learnings"]
            }
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials. Use demo / password")

@app.post("/api/draft/generate", tags=["Draft Generation"])
def generate_draft(req: DraftRequest):
    # Mock ChatChat AI response
    logger.warning("No ChatChat API key provided. Falling back to mock data.")
    return {
        "hooks": [
            "Tech culture is broken. Here's how we fix it.",
            "I spent 48 hours at Hack4Good. The biggest lesson wasn't about code."
        ],
        "storyBullets": [
            "The initial overwhelming feeling of the problem scope.",
            "How our team aligned on the core user need.",
            "The breakthrough moment at 3 AM."
        ],
        "takeaway": "Innovation isn't just about building fast; it's about building with empathy.",
        "metrics": {
            "readingLevel": "8th Grade",
            "estimatedReadTime": "2 mins"
        }
    }

@app.post("/api/publish/", tags=["Publishing"])
def publish_post(req: PublishRequest):
    # Mock LinkedIn API response
    logger.warning("No LinkedIn credentials provided. Simulating successful post.")
    return {
        "status": "success",
        "postId": "urn:li:share:123456789",
        "mockAnalytics": {
            "impressions": "1.2k",
            "reactions": 84,
            "comments": 12,
            "reposts": 3
        }
    }

@app.get("/")
def read_root():
    return {"message": "Welcome to the Stride API"}
