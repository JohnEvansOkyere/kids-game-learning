"""
Student profile management routes
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.schemas import StudentCreate, StudentResponse
from app.core.database import get_db
from app.routers.auth import get_current_user
from prisma import Prisma

router = APIRouter()


@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    student: StudentCreate,
    user = Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    """
    Add a new student (child) profile to parent account
    
    Maximum 4 children per parent account (free tier: 1, premium: 4)
    """
    # Get parent
    if not user.parent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parent profile not found"
        )
    
    # Check student limit (4 max for now, will add subscription check later)
    existing_students = await db.student.count(where={"parentId": user.parent.id})
    if existing_students >= 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 4 children allowed per account"
        )
    
    # Validate avatar
    valid_avatars = ["lion", "elephant", "cheetah", "monkey", "eagle", "fish"]
    if student.avatar not in valid_avatars:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid avatar. Must be one of: {', '.join(valid_avatars)}"
        )
    
    # Validate grade level
    valid_grades = ["KG1", "KG2", "P1", "P2", "P3"]
    if student.gradeLevel not in valid_grades:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid grade level. Must be one of: {', '.join(valid_grades)}"
        )
    
    
    # Convert date to datetime for Prisma
    from datetime import datetime as dt
    dob_datetime = dt.combine(student.dateOfBirth, dt.min.time())
    
    # Create student
    new_student = await db.student.create(
        data={
            "parentId": user.parent.id,
            "name": student.name,
            "avatar": student.avatar,
            "gradeLevel": student.gradeLevel,
            "dateOfBirth": dob_datetime
        }
    )
    
    return new_student


@router.get("/", response_model=List[StudentResponse])
async def get_students(
    user = Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    """
    Get all student profiles for current parent
    """
    if not user.parent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parent profile not found"
        )
    
    students = await db.student.find_many(
        where={"parentId": user.parent.id},
        order={"createdAt": "asc"}
    )
    
    return students


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: str,
    user = Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    """
    Get a specific student profile
    """
    if not user.parent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parent profile not found"
        )
    
    student = await db.student.find_unique(where={"id": student_id})
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Verify student belongs to current parent
    if student.parentId != user.parent.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return student
