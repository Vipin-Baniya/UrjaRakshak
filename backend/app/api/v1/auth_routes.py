"""
UrjaRakshak — Auth API Endpoints
==================================
POST /api/v1/auth/register  — Create account
POST /api/v1/auth/login     — Get JWT token
GET  /api/v1/auth/me        — Get current user
GET  /api/v1/auth/users     — List users (admin only)

Author: Vipin Baniya
"""

from datetime import timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import (
    UserCreate, UserLogin, UserPublic, TokenResponse,
    authenticate_user, create_user, create_access_token,
    get_current_active_user, require_admin
)
from app.models.db_models import User
from app.config import settings

router = APIRouter()


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Register a new user account.

    Default role is 'viewer'. To create admin/analyst accounts,
    request must come from an existing admin (not yet enforced in MVP).
    """
    user = await create_user(user_data, db)
    return UserPublic.model_validate(user)


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    Login and receive a JWT access token.

    Token expires in ACCESS_TOKEN_EXPIRE_MINUTES (default: 30 min).
    Include token in subsequent requests as: Authorization: Bearer <token>
    """
    user = await authenticate_user(credentials.email, credentials.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last login
    from datetime import datetime
    user.last_login = datetime.utcnow()
    await db.commit()

    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        role=user.role,
        user_id=user.id,
    )


@router.get("/me", response_model=UserPublic)
async def get_me(current_user: User = Depends(get_current_active_user)):
    """Get current authenticated user profile"""
    return UserPublic.model_validate(current_user)


@router.get("/users", response_model=List[UserPublic])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """List all users — admin only"""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [UserPublic.model_validate(u) for u in users]


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Deactivate a user account — admin only"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
    user.is_active = False
    await db.commit()
