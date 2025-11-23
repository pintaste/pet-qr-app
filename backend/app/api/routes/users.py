"""
User management routes.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select
from sqlalchemy import text

from ...core.dependencies import get_current_user
from ...database import get_engine
from ...models.shared import User, UserRole

router = APIRouter()


class UserUpdateRequest(BaseModel):
    """User update request schema."""
    role: Optional[UserRole] = None
    email: Optional[str] = None
    full_name: Optional[str] = None


@router.get("/me")
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """Get current user profile."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "tenant_id": current_user.tenant_id,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
    }


@router.put("/me")
async def update_current_user(
    update_data: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Update current user profile.

    ⚠️ WARNING: Role updates are for DEVELOPMENT ONLY.
    In production, role changes should require admin approval.
    """
    # Get database engine and session
    engine = get_engine()
    session = Session(engine)

    try:
        # Set search path to tenant schema
        tenant_schema = "tenant_demo"  # TODO: Get from request context
        # Quote schema name to handle special characters like hyphens
        session.execute(text(f'SET search_path TO "{tenant_schema}", public'))

        # Fetch the user from database
        statement = select(User).where(User.id == current_user.id)
        db_user = session.exec(statement).first()

        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Update fields if provided
        if update_data.email is not None:
            db_user.email = update_data.email

        if update_data.full_name is not None:
            db_user.full_name = update_data.full_name

        # ⚠️ Development feature: Allow self-service role changes
        # TODO: In production, this should require admin approval
        if update_data.role is not None:
            db_user.role = update_data.role
            print(f"[DEV] User {db_user.id} changed role to {update_data.role}")

        # Save changes
        session.add(db_user)
        session.commit()
        session.refresh(db_user)

        result = {
            "id": db_user.id,
            "email": db_user.email,
            "full_name": None,  # User model doesn't have full_name field
            "role": db_user.role,
            "tenant_id": db_user.tenant_id,
            "is_active": db_user.is_active,
            "created_at": db_user.created_at.isoformat(),
            "message": "Profile updated successfully"
        }

        return result
    finally:
        session.close()


@router.get("/")
async def get_users():
    """Get all users in tenant (admin only)."""
    return {"message": "Get users endpoint - to be implemented"}


@router.get("/{user_id}")
async def get_user(user_id: int):
    """Get user by ID."""
    return {"message": f"Get user {user_id} endpoint - to be implemented"}


@router.put("/{user_id}")
async def update_user(user_id: int):
    """Update user (admin only)."""
    return {"message": f"Update user {user_id} endpoint - to be implemented"}
