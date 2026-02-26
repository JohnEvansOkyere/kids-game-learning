"""
MathChampions Ghana - FastAPI Backend
Main application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, students, questions, game

app = FastAPI(
    title="MathChampions Ghana API",
    description="Backend API for MathChampions Ghana - Math Battle Game for Kids",
    version="1.0.0"
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(students.router, prefix="/api/students", tags=["Students"])
app.include_router(questions.router, prefix="/api/questions", tags=["Questions"])
app.include_router(game.router, prefix="/api/game", tags=["Game"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "MathChampions Ghana API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy"}
