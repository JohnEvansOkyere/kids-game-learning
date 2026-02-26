"""
Questions router - handles question retrieval and seeding
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query, Header
from typing import List
import random
from app.schemas_game import QuestionResponse
from app.core.database import get_db
from app.core.config import settings
from prisma import Prisma
from scripts.seed_questions import (
    seed_kg1_questions,
    seed_kg2_questions,
    seed_p1_questions,
    seed_p2_questions,
    seed_p3_questions,
)

router = APIRouter()


@router.get("/random", response_model=List[QuestionResponse])
async def get_random_questions(
    topic: str = Query(..., description="Topic: counting, addition, subtraction, multiplication"),
    gradeLevel: str = Query(..., description="Grade level: KG1, KG2, P1, P2, P3"),
    count: int = Query(10, ge=1, le=20, description="Number of questions to return"),
    db: Prisma = Depends(get_db)
):
    """
    Get random questions for practice
    
    Returns questions WITHOUT correct answers for game play
    """
    # Validate inputs
    valid_topics = ["counting", "addition", "subtraction", "multiplication"]
    if topic not in valid_topics:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid topic. Must be one of: {', '.join(valid_topics)}"
        )
    
    valid_grades = ["KG1", "KG2", "P1", "P2", "P3"]
    if gradeLevel not in valid_grades:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid grade level. Must be one of: {', '.join(valid_grades)}"
        )
    
    # Fetch questions from database
    questions = await db.question.find_many(
        where={
            "topic": topic,
            "gradeLevel": gradeLevel
        }
    )
    
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No questions found for topic '{topic}' and grade '{gradeLevel}'"
        )
    
    # Randomly select questions
    if len(questions) > count:
        questions = random.sample(questions, count)
    
    # Return questions without correct answers
    return questions


@router.post("/seed")
async def seed_questions(
    force: bool = False,
    x_admin_token: str = Header(..., alias="X-Admin-Token"),
    db: Prisma = Depends(get_db)
):
    """
    Seed the question bank (admin-only).

    Set force=true to clear existing questions first.
    """
    if x_admin_token != settings.ADMIN_SEED_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin token"
        )

    existing_count = await db.question.count()
    if existing_count > 0 and not force:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Questions already exist. Use force=true to reseed."
        )

    if force and existing_count > 0:
        await db.question.delete_many()

    all_questions = []
    all_questions.extend(await seed_kg1_questions(db))
    all_questions.extend(await seed_kg2_questions(db))
    all_questions.extend(await seed_p1_questions(db))
    all_questions.extend(await seed_p2_questions(db))
    all_questions.extend(await seed_p3_questions(db))

    for question in all_questions:
        await db.question.create(data=question)

    return {
        "message": "Questions seeded",
        "count": len(all_questions)
    }
