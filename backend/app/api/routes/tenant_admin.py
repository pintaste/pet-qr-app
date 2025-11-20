"""
Tenant Admin API routes.

These endpoints are accessible to TENANT_ADMIN and SUPER_ADMIN roles.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel

from app.core.dependencies import get_current_tenant_admin, get_db
from app.models.shared import User, UserRole

router = APIRouter()


class TenantUserCreate(BaseModel):
    """Request model for creating a user within a tenant."""
    email: str
    password: str


class TenantUserUpdate(BaseModel):
    """Request model for updating a user within a tenant."""
    email: Optional[str] = None
    is_active: Optional[bool] = None


class TenantPasswordReset(BaseModel):
    """Request model for resetting a user's password."""
    new_password: str


@router.get("/users", response_model=List[dict])
async def list_tenant_users(
    current_user: User = Depends(get_current_tenant_admin),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
):
    """
    List all users in the current tenant.

    Tenant Admins can only see regular users in their tenant.

    Args:
        current_user: Current tenant admin user
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        search: Search by email

    Returns:
        List of users in this tenant
    """
    # Get tenant ID from current user
    tenant_id = current_user.tenant_id

    # Build query - only show regular users (not tenant_admins or super_admins)
    statement = select(User).where(
        User.tenant_id == tenant_id,
        User.role == 'user'
    )

    if search:
        statement = statement.where(User.email.contains(search))

    statement = statement.offset(skip).limit(limit)
    users = db.exec(statement).all()

    return [
        {
            "id": user.id,
            "email": user.email,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }
        for user in users
    ]


@router.get("/users/{user_id}", response_model=dict)
async def get_tenant_user(
    user_id: int,
    current_user: User = Depends(get_current_tenant_admin),
    db: Session = Depends(get_db),
):
    """
    Get a single user by ID within the tenant.

    Args:
        user_id: User ID
        current_user: Current tenant admin user
        db: Database session

    Returns:
        User details
    """
    user = db.exec(
        select(User).where(
            User.id == user_id,
            User.tenant_id == current_user.tenant_id,
            User.role == 'user'
        )
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in your tenant",
        )

    return {
        "id": user.id,
        "email": user.email,
        "role": user.role.value if hasattr(user.role, 'value') else user.role,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.post("/users", response_model=dict)
async def create_tenant_user(
    user_data: TenantUserCreate,
    current_user: User = Depends(get_current_tenant_admin),
    db: Session = Depends(get_db),
):
    """
    Create a new user within the tenant.

    Tenant Admins can only create regular users.

    Args:
        user_data: User creation data
        current_user: Current tenant admin user
        db: Database session

    Returns:
        Created user
    """
    from app.core.security import get_password_hash

    # Check if email already exists
    existing = db.exec(select(User).where(User.email == user_data.email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Validate password
    if len(user_data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters",
        )

    # Create user with 'user' role in the current tenant
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role=UserRole.USER,
        tenant_id=current_user.tenant_id,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "email": user.email,
        "role": user.role.value if hasattr(user.role, 'value') else user.role,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.put("/users/{user_id}", response_model=dict)
async def update_tenant_user(
    user_id: int,
    user_data: TenantUserUpdate,
    current_user: User = Depends(get_current_tenant_admin),
    db: Session = Depends(get_db),
):
    """
    Update a user within the tenant.

    Args:
        user_id: User ID
        user_data: User update data
        current_user: Current tenant admin user
        db: Database session

    Returns:
        Updated user
    """
    user = db.exec(
        select(User).where(
            User.id == user_id,
            User.tenant_id == current_user.tenant_id,
            User.role == 'user'
        )
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in your tenant",
        )

    # Update fields
    if user_data.email is not None:
        # Check if new email already exists
        existing = db.exec(
            select(User).where(User.email == user_data.email, User.id != user_id)
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        user.email = user_data.email

    if user_data.is_active is not None:
        user.is_active = user_data.is_active

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "email": user.email,
        "role": user.role.value if hasattr(user.role, 'value') else user.role,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.delete("/users/{user_id}", response_model=dict)
async def delete_tenant_user(
    user_id: int,
    current_user: User = Depends(get_current_tenant_admin),
    db: Session = Depends(get_db),
):
    """
    Delete a user within the tenant.

    Args:
        user_id: User ID
        current_user: Current tenant admin user
        db: Database session

    Returns:
        Deletion confirmation
    """
    user = db.exec(
        select(User).where(
            User.id == user_id,
            User.tenant_id == current_user.tenant_id,
            User.role == 'user'
        )
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in your tenant",
        )

    user_email = user.email
    db.delete(user)
    db.commit()

    return {
        "message": f"User '{user_email}' deleted successfully",
    }


@router.post("/users/{user_id}/reset-password", response_model=dict)
async def reset_tenant_user_password(
    user_id: int,
    password_data: TenantPasswordReset,
    current_user: User = Depends(get_current_tenant_admin),
    db: Session = Depends(get_db),
):
    """
    Reset a user's password within the tenant.

    Args:
        user_id: User ID
        password_data: New password data
        current_user: Current tenant admin user
        db: Database session

    Returns:
        Success confirmation
    """
    user = db.exec(
        select(User).where(
            User.id == user_id,
            User.tenant_id == current_user.tenant_id,
            User.role == 'user'
        )
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in your tenant",
        )

    # Validate password length
    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters",
        )

    # Hash and update password
    from app.core.security import get_password_hash
    user.password_hash = get_password_hash(password_data.new_password)
    db.add(user)
    db.commit()

    return {
        "message": f"Password reset successfully for user '{user.email}'",
    }


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
