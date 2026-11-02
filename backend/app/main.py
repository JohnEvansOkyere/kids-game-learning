"""
MathChampions Ghana - FastAPI Backend
Main application entry point
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import connect_db, disconnect_db
from app.routers import auth, students, questions, game, world, events, skills


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Connect at startup so a missing/broken Prisma engine fails the deploy
    # instead of surfacing as 500s on the first request.
    await connect_db()
    yield
    await disconnect_db()


app = FastAPI(
    lifespan=lifespan,
    title="MathChampions Ghana API",
    description="Backend API for MathChampions Ghana - Math Battle Game for Kids",
    version="1.0.0"
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(students.router, prefix="/api/students", tags=["Students"])
app.include_router(questions.router, prefix="/api/questions", tags=["Questions"])
app.include_router(game.router, prefix="/api/game", tags=["Game"])
app.include_router(world.router, prefix="/api/world", tags=["Adventure World"])
app.include_router(events.router, prefix="/api/events", tags=["Analytics"])
app.include_router(skills.router, prefix="/api/skills", tags=["Skills"])

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
