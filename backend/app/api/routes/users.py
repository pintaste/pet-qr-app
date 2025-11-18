"""
User management routes.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/me")
async def get_current_user():
    """Get current user profile."""
    return {"message": "Get current user endpoint - to be implemented"}


@router.put("/me")
async def update_current_user():
    """Update current user profile."""
    return {"message": "Update current user endpoint - to be implemented"}


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
