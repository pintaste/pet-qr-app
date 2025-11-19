"""
Super Admin API routes.

These endpoints are only accessible to users with SUPER_ADMIN role.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel

from app.core.dependencies import get_current_super_user, get_db
from app.models.shared import User, Tenant, UserRole, QRBatch

router = APIRouter()


class TenantCreate(BaseModel):
    """Request model for creating a tenant."""

    name: str
    subdomain: str
    tier: str = "standard"
    admin_email: str
    admin_password: str


class QRBatchCreate(BaseModel):
    """Request model for creating a QR code batch."""

    batch_id: str
    quantity: int
    assigned_to_tenant_id: Optional[int] = None
    print_data: Optional[dict] = None


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

    result = []
    for tenant in tenants:
        # Count users in this tenant
        user_count = len(
            db.exec(select(User).where(User.tenant_id == tenant.id)).all()
        )

        result.append({
            "id": tenant.id,
            "name": tenant.name,
            "subdomain": tenant.subdomain,
            "custom_domain": tenant.custom_domain,
            "tier": tenant.tier,
            "is_active": tenant.is_active,
            "created_at": tenant.created_at.isoformat() if tenant.created_at else None,
            "user_count": user_count,
        })

    return result


@router.post("/tenants", response_model=dict)
async def create_tenant(
    tenant_data: TenantCreate,
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Create a new tenant.

    Args:
        tenant_data: Tenant creation data
        current_user: Current super admin user
        db: Database session

    Returns:
        Created tenant
    """
    from app.core.security import get_password_hash

    # Check if subdomain already exists
    existing = db.exec(
        select(Tenant).where(Tenant.subdomain == tenant_data.subdomain)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subdomain already exists",
        )

    # Create tenant
    tenant = Tenant(
        name=tenant_data.name,
        subdomain=tenant_data.subdomain,
        tier=tenant_data.tier,
        settings={},
        is_active=True,
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)

    # Create tenant admin user
    admin_user = User(
        email=tenant_data.admin_email,
        password_hash=get_password_hash(tenant_data.admin_password),
        tenant_id=tenant.id,
        role=UserRole.TENANT_ADMIN,
        is_active=True,
    )
    db.add(admin_user)
    db.commit()

    # TODO: Create tenant schema in database

    return {
        "id": tenant.id,
        "name": tenant.name,
        "subdomain": tenant.subdomain,
        "tier": tenant.tier,
        "is_active": tenant.is_active,
        "created_at": tenant.created_at.isoformat() if tenant.created_at else None,
    }


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


@router.post("/qr/batch", response_model=dict)
async def generate_qr_batch(
    batch_data: QRBatchCreate,
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Generate a new batch of QR codes.

    Args:
        batch_data: QR batch creation data
        current_user: Current super admin user
        db: Database session

    Returns:
        Created QR batch information
    """
    # Check if batch_id already exists
    existing = db.exec(
        select(QRBatch).where(QRBatch.batch_id == batch_data.batch_id)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Batch ID already exists",
        )

    # If assigning to tenant, verify tenant exists
    if batch_data.assigned_to_tenant_id:
        tenant = db.exec(
            select(Tenant).where(Tenant.id == batch_data.assigned_to_tenant_id)
        ).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found",
            )

    # Create QR batch
    qr_batch = QRBatch(
        batch_id=batch_data.batch_id,
        quantity=batch_data.quantity,
        assigned_to_tenant_id=batch_data.assigned_to_tenant_id,
        created_by_admin_id=current_user.id,
        print_data=batch_data.print_data or {},
    )
    db.add(qr_batch)
    db.commit()
    db.refresh(qr_batch)

    # TODO: Generate actual QR codes and store in appropriate schema

    return {
        "id": qr_batch.id,
        "batch_id": qr_batch.batch_id,
        "quantity": qr_batch.quantity,
        "assigned_to_tenant_id": qr_batch.assigned_to_tenant_id,
        "created_at": qr_batch.created_at.isoformat() if qr_batch.created_at else None,
        "status": "created",
    }


@router.get("/qr/inventory", response_model=List[dict])
async def get_qr_inventory(
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Get QR code batch inventory.

    Args:
        current_user: Current super admin user
        db: Database session

    Returns:
        List of all QR batches with assignment information
    """
    statement = select(QRBatch)
    batches = db.exec(statement).all()

    result = []
    for batch in batches:
        # Get tenant name if assigned
        tenant_name = None
        if batch.assigned_to_tenant_id:
            tenant = db.exec(
                select(Tenant).where(Tenant.id == batch.assigned_to_tenant_id)
            ).first()
            if tenant:
                tenant_name = tenant.name

        result.append({
            "id": batch.id,
            "batch_id": batch.batch_id,
            "quantity": batch.quantity,
            "assigned_to_tenant_id": batch.assigned_to_tenant_id,
            "tenant_name": tenant_name,
            "created_at": batch.created_at.isoformat() if batch.created_at else None,
            "print_data": batch.print_data,
        })

    return result
