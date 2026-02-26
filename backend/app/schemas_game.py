"""
Pydantic schemas for game-related requests/responses
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# ============ Question Schemas ============

class QuestionBase(BaseModel):
    topic: str
    gradeLevel: str
    difficulty: int
    questionText: str
    option1: int
    option2: int
    option3: int
    option4: int


class QuestionResponse(QuestionBase):
    """Question response WITHOUT correct answer (for game play)"""
    id: str
    
    class Config:
        from_attributes = True


class QuestionWithAnswer(QuestionResponse):
    """Question response WITH correct answer (for validation)"""
    correctAnswer: int
    explanation: Optional[str] = None


# ============ Game Session Schemas ============

class PracticeStartRequest(BaseModel):
    studentId: str
    topic: str  # counting, addition, subtraction, multiplication
    gradeLevel: str  # KG1, KG2, P1, P2, P3


class PracticeStartResponse(BaseModel):
    sessionId: str
    # Include correct answers to support offline validation on device
    # Frontend should not display these directly.
    questions: List[QuestionWithAnswer]


class AnswerSubmitRequest(BaseModel):
    sessionId: str
    questionId: str
    answer: int
    timeSpent: int  # seconds


class AnswerSubmitResponse(BaseModel):
    correct: bool
    correctAnswer: int
    explanation: Optional[str] = None


class PracticeCompleteRequest(BaseModel):
    sessionId: str


class PracticeCompleteResponse(BaseModel):
    totalQuestions: int
    correctAnswers: int
    wrongAnswers: int
    totalTimeSpent: int
    starsEarned: int
    accuracy: float  # percentage


class GameSessionResponse(BaseModel):
    id: str
    sessionType: str
    topic: str
    gradeLevel: str
    totalQuestions: int
    correctAnswers: int
    wrongAnswers: int
    totalTimeSpent: int
    starsEarned: int
    completed: bool
    startedAt: datetime
    completedAt: Optional[datetime] = None
    
    class Config:
        from_attributes = True
