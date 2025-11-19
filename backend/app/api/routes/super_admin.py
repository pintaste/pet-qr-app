"""
Super Admin API routes.

These endpoints are only accessible to users with SUPER_ADMIN role.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.dependencies import get_current_super_user, get_db
from app.models.shared import User, Tenant

router = APIRouter()


@router.get("/tenants", response_model=List[dict])
async def list_all_tenants(
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    List all tenants in the platform.

    Args:
        current_user: Current super admin user
        db: Database session

    Returns:
        List of all tenants with stats
    """
    statement = select(Tenant)
    tenants = db.exec(statement).all()

    # TODO: Add user counts, pet counts, etc. for each tenant
    return [
        {
            "id": tenant.id,
            "name": tenant.name,
            "subdomain": tenant.subdomain,
            "custom_domain": tenant.custom_domain,
            "tier": tenant.tier,
            "is_active": tenant.is_active,
            "created_at": tenant.created_at,
        }
        for tenant in tenants
    ]


@router.get("/users", response_model=List[dict])
async def list_all_users(
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    List all users across all tenants.

    Args:
        current_user: Current super admin user
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        List of all users with tenant information
    """
    statement = select(User).offset(skip).limit(limit)
    users = db.exec(statement).all()

    return [
        {
            "id": user.id,
            "email": user.email,
            "tenant_id": user.tenant_id,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at,
        }
        for user in users
    ]


@router.get("/analytics/platform")
async def get_platform_analytics(
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Get platform-wide analytics and statistics.

    Args:
        current_user: Current super admin user
        db: Database session

    Returns:
        Platform analytics data
    """
    # Count total tenants
    tenant_statement = select(Tenant)
    total_tenants = len(db.exec(tenant_statement).all())

    # Count total users
    user_statement = select(User)
    total_users = len(db.exec(user_statement).all())

    # TODO: Add more analytics (pets, QR codes, scans, etc.)

    return {
        "total_tenants": total_tenants,
        "active_tenants": len(db.exec(select(Tenant).where(Tenant.is_active == True)).all()),
        "total_users": total_users,
        "active_users": len(db.exec(select(User).where(User.is_active == True)).all()),
        # Placeholders for future implementation
        "total_pets": 0,
        "total_qr_codes": 0,
        "total_scans": 0,
    }
