"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date


# ============ User & Auth Schemas ============

class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserResponse(UserBase):
    id: str
    createdAt: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None


# ============ Parent Schemas ============

class ParentBase(BaseModel):
    name: str
    phoneNumber: Optional[str] = None


class ParentCreate(ParentBase):
    pass


class ParentResponse(ParentBase):
    id: str
    userId: str
    createdAt: datetime
    
    class Config:
        from_attributes = True


# ============ Student Schemas ============

class StudentBase(BaseModel):
    name: str
    avatar: str  # lion, elephant, cheetah, monkey, eagle, fish
    gradeLevel: str  # KG1, KG2, P1, P2, P3
    dateOfBirth: Optional[date] = None


class StudentCreate(StudentBase):
    pass


class StudentResponse(StudentBase):
    id: str
    parentId: str
    createdAt: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            date: lambda v: v.isoformat() if v else None,
            datetime: lambda v: v.isoformat() if v else None
        }


# ============ Registration Schema ============

class RegisterRequest(BaseModel):
    """Complete registration with parent and first child"""
    # User/Parent info
    # Only what's needed to start playing; no email verification for now
    email: EmailStr
    password: str = Field(..., min_length=6)
    parentName: str = Field(..., min_length=1)
    phoneNumber: Optional[str] = None

    # First child info
    childName: str = Field(..., min_length=1)
    childAvatar: str = "lion"
    childGradeLevel: str
    childDateOfBirth: Optional[date] = None


class RegisterResponse(BaseModel):
    user: UserResponse
    parent: ParentResponse
    student: StudentResponse
    token: Token


# ============ Login Schema ============

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    user: UserResponse
    parent: ParentResponse
    students: List[StudentResponse]
    token: Token
