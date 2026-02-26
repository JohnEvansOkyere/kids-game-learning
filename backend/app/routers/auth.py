"""
Authentication routes
Handles user registration, login, logout, and current user retrieval
"""
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime
import logging
from app.schemas import (
    RegisterRequest, RegisterResponse, LoginRequest, LoginResponse,
    UserResponse, Token
)
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.core.database import get_db
from prisma import Prisma

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: Prisma = Depends(get_db)):
    """
    Register a new parent account with first child profile
    
    Creates:
    - User account with email/password
    - Parent profile
    - First student (child) profile
    
    Returns JWT token for immediate login
    """
    try:
        # Check if email already exists
        existing_user = await db.user.find_unique(where={"email": request.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Validate avatar
        valid_avatars = ["lion", "elephant", "cheetah", "monkey", "eagle", "fish"]
        if request.childAvatar not in valid_avatars:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid avatar. Must be one of: {', '.join(valid_avatars)}"
            )
        
        # Validate grade level
        valid_grades = ["KG1", "KG2", "P1", "P2", "P3"]
        if request.childGradeLevel not in valid_grades:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid grade level. Must be one of: {', '.join(valid_grades)}"
            )
        
        # Hash password
        password_hash = get_password_hash(request.password)
        
        # Create user
        user = await db.user.create(
            data={
                "email": request.email,
                "passwordHash": password_hash
            }
        )
        logger.info(f"Created user: {user.email}")
        
        # Create parent profile
        parent = await db.parent.create(
            data={
                "userId": user.id,
                "name": request.parentName,
                "phoneNumber": request.phoneNumber
            }
        )
        logger.info(f"Created parent profile for: {parent.name}")
        
        # Create first student profile
        # Convert date to datetime for Prisma
        from datetime import datetime as dt
        dob_datetime = dt.combine(request.childDateOfBirth, dt.min.time())
        
        student = await db.student.create(
            data={
                "parentId": parent.id,
                "name": request.childName,
                "avatar": request.childAvatar,
                "gradeLevel": request.childGradeLevel,
                "dateOfBirth": dob_datetime
            }
        )
        logger.info(f"Created student profile: {student.name}")
        
        # Generate JWT token
        access_token = create_access_token(data={"sub": user.email})
        
        return RegisterResponse(
            user=UserResponse(
                id=user.id,
                email=user.email,
                createdAt=user.createdAt
            ),
            parent=parent,
            student=student,
            token=Token(access_token=access_token)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Prisma = Depends(get_db)):
    """
    Login with email and password
    
    Returns:
    - User info
    - Parent profile
    - All student profiles
    - JWT token
    """
    # Find user by email
    user = await db.user.find_unique(
        where={"email": request.email},
        include={"parent": {"include": {"students": True}}}
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(request.password, user.passwordHash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if parent profile exists
    if not user.parent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parent profile not found"
        )
    
    # Generate JWT token
    access_token = create_access_token(data={"sub": user.email})
    
    return LoginResponse(
        user=UserResponse(
            id=user.id,
            email=user.email,
            createdAt=user.createdAt
        ),
        parent=user.parent,
        students=user.parent.students or [],
        token=Token(access_token=access_token)
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Prisma = Depends(get_db)
):
    """
    Dependency to get current authenticated user from JWT token
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    email = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    user = await db.user.find_unique(
        where={"email": email},
        include={"parent": {"include": {"students": True}}}
    )
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user


@router.get("/me", response_model=LoginResponse)
async def get_me(user = Depends(get_current_user)):
    """
    Get current authenticated user's profile
    """
    # Generate new token
    access_token = create_access_token(data={"sub": user.email})
    
    return LoginResponse(
        user=UserResponse(
            id=user.id,
            email=user.email,
            createdAt=user.createdAt
        ),
        parent=user.parent,
        students=user.parent.students or [],
        token=Token(access_token=access_token)
    )


@router.post("/logout")
async def logout():
    """
    Logout endpoint (client-side token removal)
    """
    return {"message": "Logged out successfully"}
