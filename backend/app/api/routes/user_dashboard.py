"""
User Dashboard API routes.

These endpoints are accessible to all authenticated users (USER, TENANT_ADMIN, SUPER_ADMIN).
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.core.dependencies import get_current_regular_user, get_db
from app.models.shared import User

router = APIRouter()


@router.get("/dashboard/stats")
async def get_user_dashboard_stats(
    current_user: User = Depends(get_current_regular_user),
    db: Session = Depends(get_db),
):
    """
    Get dashboard statistics for the current user.

    Args:
        current_user: Current authenticated user
        db: Database session

    Returns:
        User-specific dashboard statistics
    """
    # TODO: Query tenant schema for user's pets, QR codes, and scans
    # For now, return placeholder data

    return {
        "total_pets": 0,
        "active_qr_codes": 0,
        "total_scans": 0,
        "recent_scans": 0,
    }


@router.get("/dashboard/activity")
async def get_user_activity(
    current_user: User = Depends(get_current_regular_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 20,
):
    """
    Get recent activity for the current user's pets.

    Args:
        current_user: Current authenticated user
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        List of recent scan events
    """
    # TODO: Query tenant schema for scan events related to user's pets
    # For now, return empty list

    return []
