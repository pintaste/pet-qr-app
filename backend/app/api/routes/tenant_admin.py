"""
Tenant Admin API routes.

These endpoints are accessible to TENANT_ADMIN and SUPER_ADMIN roles.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.dependencies import get_current_tenant_admin, get_db
from app.models.shared import User

router = APIRouter()


@router.get("/users", response_model=List[dict])
async def list_tenant_users(
    current_user: User = Depends(get_current_tenant_admin),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    List all users in the current tenant.

    Args:
        current_user: Current tenant admin user
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        List of users in this tenant
    """
    # Get tenant ID from current user
    tenant_id = current_user.tenant_id

    statement = (
        select(User)
        .where(User.tenant_id == tenant_id)
        .offset(skip)
        .limit(limit)
    )
    users = db.exec(statement).all()

    return [
        {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at,
        }
        for user in users
    ]


@router.get("/analytics/tenant")
async def get_tenant_analytics(
    current_user: User = Depends(get_current_tenant_admin),
    db: Session = Depends(get_db),
):
    """
    Get analytics for the current tenant.

    Args:
        current_user: Current tenant admin user
        db: Database session

    Returns:
        Tenant-specific analytics data
    """
    tenant_id = current_user.tenant_id

    # Count users in this tenant
    user_statement = select(User).where(User.tenant_id == tenant_id)
    total_users = len(db.exec(user_statement).all())
    active_users = len(
        db.exec(select(User).where(User.tenant_id == tenant_id, User.is_active == True)).all()
    )

    # TODO: Add more analytics from tenant schema (pets, QR codes, scans)

    return {
        "tenant_id": tenant_id,
        "total_users": total_users,
        "active_users": active_users,
        # Placeholders for future implementation
        "total_pets": 0,
        "total_qr_codes": 0,
        "active_qr_codes": 0,
        "total_scans": 0,
    }
