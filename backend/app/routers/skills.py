"""
Skills router - the skill graph and each student's mastery of it
"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends
from prisma import Prisma
from pydantic import BaseModel

from app.core.database import get_db
from app.mastery import compute_mastery
from app.routers.auth import get_current_user
from app.routers.world import get_owned_student
from app.skills_content import SKILLS, SKILLS_BY_ID

router = APIRouter()


class SkillResponse(BaseModel):
    id: str
    naccaCode: Optional[str] = None
    gradeLevel: str
    strand: str
    topic: str
    title: str
    parentDescription: str
    prerequisiteIds: List[str]
    order: int


class SkillMasteryResponse(BaseModel):
    skill: SkillResponse
    attempts: int
    correct: int
    recentAccuracy: Optional[float] = None
    status: str  # not_started, learning, practising, mastered
    lastPracticedAt: Optional[datetime] = None
    prerequisitesMastered: bool


@router.get("/", response_model=List[SkillResponse])
async def list_skills():
    """The skill graph in teaching order"""
    return [SkillResponse(**s) for s in sorted(SKILLS, key=lambda s: s["order"])]


@router.get("/students/{student_id}", response_model=List[SkillMasteryResponse])
async def get_student_mastery(
    student_id: str,
    user = Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    """
    Mastery of every skill for one student, from their answers

    Only answers to questions tagged with a skill count.
    """
    await get_owned_student(student_id, user, db)

    answers = await db.answer.find_many(
        where={
            "session": {"is": {"studentId": student_id}},
            "question": {"is": {"skillId": {"not": None}}},
        },
        include={"question": True},
    )
    rows = [(a.question.skillId, a.isCorrect, a.answeredAt) for a in answers]

    return [
        SkillMasteryResponse(skill=SkillResponse(**SKILLS_BY_ID[m.pop("skillId")]), **m)
        for m in compute_mastery(rows)
    ]
