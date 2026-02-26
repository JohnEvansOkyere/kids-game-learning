"""
Game router - handles practice mode and game sessions
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime
import random
import logging

from app.schemas_game import (
    PracticeStartRequest, PracticeStartResponse,
    AnswerSubmitRequest, AnswerSubmitResponse,
    PracticeCompleteRequest, PracticeCompleteResponse,
    GameSessionResponse, QuestionWithAnswer
)
from app.core.database import get_db
from app.routers.auth import get_current_user
from prisma import Prisma

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/practice/start", response_model=PracticeStartResponse)
async def start_practice_session(
    request: PracticeStartRequest,
    user = Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    """
    Start a new practice session
    
    Creates a game session and returns 10 random questions
    """
    try:
        # Verify student belongs to current user's parent
        student = await db.student.find_unique(
            where={"id": request.studentId},
            include={"parent": True}
        )
        
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        if student.parent.userId != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Validate topic and grade level
        valid_topics = ["counting", "addition", "subtraction", "multiplication"]
        if request.topic not in valid_topics:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid topic. Must be one of: {', '.join(valid_topics)}"
            )
        
        valid_grades = ["KG1", "KG2", "P1", "P2", "P3"]
        if request.gradeLevel not in valid_grades:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid grade level. Must be one of: {', '.join(valid_grades)}"
            )
        
        # Fetch random questions
        questions = await db.question.find_many(
            where={
                "topic": request.topic,
                "gradeLevel": request.gradeLevel
            }
        )
        
        if not questions:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No questions found for topic '{request.topic}' and grade '{request.gradeLevel}'"
            )
        
        # Select 10 random questions
        selected_questions = random.sample(questions, min(10, len(questions)))
        
        # Create game session
        session = await db.gamesession.create(
            data={
                "studentId": request.studentId,
                "sessionType": "practice",
                "topic": request.topic,
                "gradeLevel": request.gradeLevel,
                "totalQuestions": len(selected_questions)
            }
        )
        
        logger.info(f"Started practice session {session.id} for student {request.studentId}")
        
        # Return session ID and questions (without correct answers)
        return PracticeStartResponse(
            sessionId=session.id,
            questions=[QuestionWithAnswer(**q.dict()) for q in selected_questions]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting practice session: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start practice session: {str(e)}"
        )


@router.post("/practice/answer", response_model=AnswerSubmitResponse)
async def submit_answer(
    request: AnswerSubmitRequest,
    user = Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    """
    Submit an answer for a question
    
    Validates the answer and updates session stats
    """
    try:
        # Verify session exists and belongs to user's student
        session = await db.gamesession.find_unique(
            where={"id": request.sessionId},
            include={"student": {"include": {"parent": True}}}
        )
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        if session.student.parent.userId != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        if session.completed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session already completed"
            )
        
        # Get question
        question = await db.question.find_unique(
            where={"id": request.questionId}
        )
        
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        # Idempotency: return existing answer if already submitted
        existing_answer = await db.answer.find_unique(
            where={
                "sessionId_questionId": {
                    "sessionId": request.sessionId,
                    "questionId": request.questionId
                }
            }
        )
        if existing_answer:
            return AnswerSubmitResponse(
                correct=existing_answer.isCorrect,
                correctAnswer=question.correctAnswer,
                explanation=question.explanation
            )
        
        # Check if correct
        is_correct = request.answer == question.correctAnswer
        
        # Create answer record
        try:
            await db.answer.create(
                data={
                    "sessionId": request.sessionId,
                    "questionId": request.questionId,
                    "selectedAnswer": request.answer,
                    "isCorrect": is_correct,
                    "timeSpent": request.timeSpent
                }
            )
        except Exception:
            # If a concurrent request already inserted the answer, read and return it
            existing_answer = await db.answer.find_unique(
                where={
                    "sessionId_questionId": {
                        "sessionId": request.sessionId,
                        "questionId": request.questionId
                    }
                }
            )
            if existing_answer:
                return AnswerSubmitResponse(
                    correct=existing_answer.isCorrect,
                    correctAnswer=question.correctAnswer,
                    explanation=question.explanation
                )
            raise
        
        # Update session stats
        update_data = {
            "totalTimeSpent": session.totalTimeSpent + request.timeSpent
        }
        
        if is_correct:
            update_data["correctAnswers"] = session.correctAnswers + 1
        else:
            update_data["wrongAnswers"] = session.wrongAnswers + 1
        
        await db.gamesession.update(
            where={"id": request.sessionId},
            data=update_data
        )
        
        logger.info(f"Answer submitted for session {request.sessionId}: {'correct' if is_correct else 'wrong'}")
        
        return AnswerSubmitResponse(
            correct=is_correct,
            correctAnswer=question.correctAnswer,
            explanation=question.explanation
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting answer: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit answer: {str(e)}"
        )


@router.post("/practice/complete", response_model=PracticeCompleteResponse)
async def complete_practice_session(
    request: PracticeCompleteRequest,
    user = Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    """
    Complete a practice session
    
    Marks session as complete and calculates final stats and rewards
    """
    try:
        # Verify session
        session = await db.gamesession.find_unique(
            where={"id": request.sessionId},
            include={"student": {"include": {"parent": True}}}
        )
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        if session.student.parent.userId != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        if session.completed:
            accuracy = (session.correctAnswers / session.totalQuestions * 100) if session.totalQuestions > 0 else 0
            return PracticeCompleteResponse(
                totalQuestions=session.totalQuestions,
                correctAnswers=session.correctAnswers,
                wrongAnswers=session.wrongAnswers,
                totalTimeSpent=session.totalTimeSpent,
                starsEarned=session.starsEarned,
                accuracy=round(accuracy, 1)
            )
        
        # Calculate accuracy and stars
        accuracy = (session.correctAnswers / session.totalQuestions * 100) if session.totalQuestions > 0 else 0
        
        # Star calculation: 1-5 stars based on accuracy
        if accuracy >= 90:
            stars = 50
        elif accuracy >= 80:
            stars = 40
        elif accuracy >= 70:
            stars = 30
        elif accuracy >= 60:
            stars = 20
        else:
            stars = 10
        
        # Update session
        await db.gamesession.update(
            where={"id": request.sessionId},
            data={
                "completed": True,
                "completedAt": datetime.utcnow(),
                "starsEarned": stars
            }
        )
        
        logger.info(f"Completed practice session {request.sessionId}: {accuracy:.1f}% accuracy, {stars} stars")
        
        return PracticeCompleteResponse(
            totalQuestions=session.totalQuestions,
            correctAnswers=session.correctAnswers,
            wrongAnswers=session.wrongAnswers,
            totalTimeSpent=session.totalTimeSpent,
            starsEarned=stars,
            accuracy=round(accuracy, 1)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing practice session: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete practice session: {str(e)}"
        )


@router.get("/sessions/{student_id}", response_model=List[GameSessionResponse])
async def get_student_sessions(
    student_id: str,
    user = Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    """
    Get all game sessions for a student
    """
    try:
        # Verify student belongs to user
        student = await db.student.find_unique(
            where={"id": student_id},
            include={"parent": True}
        )
        
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        if student.parent.userId != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Get sessions
        sessions = await db.gamesession.find_many(
            where={"studentId": student_id},
            order={"startedAt": "desc"}
        )

        # Recompute stats from answers so history reflects actual play
        enriched: List[GameSessionResponse] = []
        for session in sessions:
            answers = await db.answer.find_many(where={"sessionId": session.id})
            correct_count = sum(1 for a in answers if a.isCorrect)
            wrong_count = sum(1 for a in answers if not a.isCorrect)
            total_time = sum(a.timeSpent for a in answers)
            total_questions = session.totalQuestions or len(answers)

            enriched.append(
                GameSessionResponse(
                    id=session.id,
                    sessionType=session.sessionType,
                    topic=session.topic,
                    gradeLevel=session.gradeLevel,
                    totalQuestions=total_questions,
                    correctAnswers=correct_count,
                    wrongAnswers=wrong_count,
                    totalTimeSpent=total_time,
                    starsEarned=session.starsEarned,
                    completed=session.completed,
                    startedAt=session.startedAt,
                    completedAt=session.completedAt,
                )
            )

        return enriched
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching student sessions: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch sessions: {str(e)}"
        )
