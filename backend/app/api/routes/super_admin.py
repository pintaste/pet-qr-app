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

    from sqlalchemy import text

    result = []
    for tenant in tenants:
        # Count users in this tenant
        users = db.exec(select(User).where(User.tenant_id == tenant.id)).all()
        user_count = len(users)
        admin_count = len([u for u in users if u.role == UserRole.TENANT_ADMIN])

        # Count pets and QR codes from tenant schema
        pet_count = 0
        qr_count = 0
        scan_count = 0
        try:
            schema_name = f"tenant_{tenant.subdomain}"
            pet_result = db.exec(text(f"SELECT COUNT(*) FROM {schema_name}.pets")).first()
            qr_result = db.exec(text(f"SELECT COUNT(*) FROM {schema_name}.qr_codes")).first()
            scan_result = db.exec(text(f"SELECT COUNT(*) FROM {schema_name}.pet_scan_logs")).first()
            pet_count = pet_result[0] if pet_result else 0
            qr_count = qr_result[0] if qr_result else 0
            scan_count = scan_result[0] if scan_result else 0
        except Exception:
            # Schema might not exist yet or tables not created
            pass

        result.append({
            "id": tenant.id,
            "name": tenant.name,
            "subdomain": tenant.subdomain,
            "custom_domain": tenant.custom_domain,
            "tier": tenant.tier.value if hasattr(tenant.tier, 'value') else tenant.tier,
            "is_active": tenant.is_active,
            "subscription_expires_at": tenant.subscription_expires_at.isoformat() if tenant.subscription_expires_at else None,
            "created_at": tenant.created_at.isoformat() if tenant.created_at else None,
            "user_count": user_count,
            "admin_count": admin_count,
            "pet_count": pet_count,
            "qr_count": qr_count,
            "scan_count": scan_count,
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
    # Convert tier string to TenantTier enum
    from app.models.shared import TenantTier
    tier_enum = TenantTier.STANDARD if tenant_data.tier == "standard" else TenantTier.ENTERPRISE

    tenant = Tenant(
        name=tenant_data.name,
        subdomain=tenant_data.subdomain,
        tier=tier_enum,
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

    # Create tenant schema in database
    try:
        from sqlalchemy import text
        schema_name = f"tenant_{tenant_data.subdomain.replace('-', '_')}"

        # Create schema
        db.exec(text(f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"'))

        # Create tenant-specific tables in the new schema
        # Pets table
        db.exec(text(f'''
            CREATE TABLE IF NOT EXISTS "{schema_name}".pets (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                species VARCHAR(100),
                breed VARCHAR(100),
                age_years INTEGER,
                owner_user_id INTEGER REFERENCES shared.users(id),
                qr_code_id VARCHAR(255) UNIQUE,
                profile_image_url TEXT,
                medical_info JSONB,
                contact_info JSONB,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        '''))

        # QR codes table for this tenant
        db.exec(text(f'''
            CREATE TABLE IF NOT EXISTS "{schema_name}".qr_codes (
                id SERIAL PRIMARY KEY,
                code VARCHAR(255) UNIQUE NOT NULL,
                pet_id INTEGER REFERENCES "{schema_name}".pets(id),
                is_activated BOOLEAN DEFAULT FALSE,
                activated_at TIMESTAMP,
                scan_count INTEGER DEFAULT 0,
                last_scanned_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            )
        '''))

        # Scan logs table
        db.exec(text(f'''
            CREATE TABLE IF NOT EXISTS "{schema_name}".scan_logs (
                id SERIAL PRIMARY KEY,
                qr_code_id INTEGER REFERENCES "{schema_name}".qr_codes(id),
                scanned_at TIMESTAMP DEFAULT NOW(),
                ip_address VARCHAR(50),
                user_agent TEXT,
                location JSONB
            )
        '''))

        db.commit()
        print(f"[SuperAdmin] Created schema '{schema_name}' with tables for tenant {tenant.name}")
    except Exception as e:
        print(f"[SuperAdmin] Warning: Failed to create tenant schema: {e}")
        # Don't fail the tenant creation if schema creation fails

    return {
        "id": tenant.id,
        "name": tenant.name,
        "subdomain": tenant.subdomain,
        "tier": tenant.tier.value if hasattr(tenant.tier, 'value') else tenant.tier,
        "is_active": tenant.is_active,
        "subscription_expires_at": tenant.subscription_expires_at.isoformat() if tenant.subscription_expires_at else None,
        "created_at": tenant.created_at.isoformat() if tenant.created_at else None,
    }


class TenantUpdate(BaseModel):
    """Request model for updating a tenant."""

    name: Optional[str] = None
    tier: Optional[str] = None
    is_active: Optional[bool] = None
    custom_domain: Optional[str] = None
    subscription_expires_at: Optional[str] = None


@router.get("/tenants/{tenant_id}", response_model=dict)
async def get_tenant(
    tenant_id: int,
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Get a single tenant by ID.

    Args:
        tenant_id: Tenant ID
        current_user: Current super admin user
        db: Database session

    Returns:
        Tenant details
    """
    tenant = db.exec(select(Tenant).where(Tenant.id == tenant_id)).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )

    # Count users in this tenant
    user_count = len(
        db.exec(select(User).where(User.tenant_id == tenant.id)).all()
    )

    # Get tenant admins
    tenant_admins = db.exec(
        select(User).where(
            User.tenant_id == tenant.id,
            User.role == UserRole.TENANT_ADMIN
        )
    ).all()

    return {
        "id": tenant.id,
        "name": tenant.name,
        "subdomain": tenant.subdomain,
        "custom_domain": tenant.custom_domain,
        "tier": tenant.tier.value if hasattr(tenant.tier, 'value') else tenant.tier,
        "is_active": tenant.is_active,
        "subscription_expires_at": tenant.subscription_expires_at.isoformat() if tenant.subscription_expires_at else None,
        "created_at": tenant.created_at.isoformat() if tenant.created_at else None,
        "updated_at": tenant.updated_at.isoformat() if tenant.updated_at else None,
        "user_count": user_count,
        "admins": [
            {"id": admin.id, "email": admin.email}
            for admin in tenant_admins
        ],
        "settings": tenant.settings,
    }


@router.put("/tenants/{tenant_id}", response_model=dict)
async def update_tenant(
    tenant_id: int,
    tenant_data: TenantUpdate,
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Update a tenant.

    Args:
        tenant_id: Tenant ID
        tenant_data: Tenant update data
        current_user: Current super admin user
        db: Database session

    Returns:
        Updated tenant
    """
    from datetime import datetime
    from app.models.shared import TenantTier

    tenant = db.exec(select(Tenant).where(Tenant.id == tenant_id)).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )

    # Update fields if provided
    if tenant_data.name is not None:
        tenant.name = tenant_data.name

    if tenant_data.tier is not None:
        tier_enum = TenantTier.STANDARD if tenant_data.tier == "standard" else TenantTier.ENTERPRISE
        tenant.tier = tier_enum

    if tenant_data.is_active is not None:
        tenant.is_active = tenant_data.is_active

    if tenant_data.custom_domain is not None:
        tenant.custom_domain = tenant_data.custom_domain if tenant_data.custom_domain else None

    if tenant_data.subscription_expires_at is not None:
        if tenant_data.subscription_expires_at:
            tenant.subscription_expires_at = datetime.fromisoformat(tenant_data.subscription_expires_at.replace('Z', '+00:00'))
        else:
            tenant.subscription_expires_at = None

    tenant.updated_at = datetime.utcnow()

    db.add(tenant)
    db.commit()
    db.refresh(tenant)

    return {
        "id": tenant.id,
        "name": tenant.name,
        "subdomain": tenant.subdomain,
        "custom_domain": tenant.custom_domain,
        "tier": tenant.tier.value if hasattr(tenant.tier, 'value') else tenant.tier,
        "is_active": tenant.is_active,
        "subscription_expires_at": tenant.subscription_expires_at.isoformat() if tenant.subscription_expires_at else None,
        "created_at": tenant.created_at.isoformat() if tenant.created_at else None,
        "updated_at": tenant.updated_at.isoformat() if tenant.updated_at else None,
    }


@router.delete("/tenants/{tenant_id}", response_model=dict)
async def delete_tenant(
    tenant_id: int,
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Delete a tenant and all associated data.

    Args:
        tenant_id: Tenant ID
        current_user: Current super admin user
        db: Database session

    Returns:
        Deletion confirmation
    """
    tenant = db.exec(select(Tenant).where(Tenant.id == tenant_id)).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )

    tenant_name = tenant.name
    tenant_subdomain = tenant.subdomain

    # Delete all users belonging to this tenant
    tenant_users = db.exec(select(User).where(User.tenant_id == tenant_id)).all()
    for user in tenant_users:
        db.delete(user)

    # Delete the tenant
    db.delete(tenant)
    db.commit()

    # Drop tenant schema from database
    try:
        from sqlalchemy import text
        schema_name = f"tenant_{tenant_subdomain.replace('-', '_')}"
        db.exec(text(f'DROP SCHEMA IF EXISTS "{schema_name}" CASCADE'))
        db.commit()
        print(f"[SuperAdmin] Dropped schema '{schema_name}' for tenant {tenant_name}")
    except Exception as e:
        print(f"[SuperAdmin] Warning: Failed to drop tenant schema: {e}")

    return {
        "message": f"Tenant '{tenant_name}' ({tenant_subdomain}) deleted successfully",
        "deleted_users": len(tenant_users),
    }


class UserCreate(BaseModel):
    """Request model for creating a user."""

    email: str
    password: str
    role: str = "user"
    tenant_id: Optional[int] = None


class UserUpdate(BaseModel):
    """Request model for updating a user."""

    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    tenant_id: Optional[int] = None


@router.get("/users", response_model=List[dict])
async def list_all_users(
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    role: Optional[str] = None,
    tenant_id: Optional[int] = None,
    search: Optional[str] = None,
):
    """
    List all users in the platform.

    Super Admins can view all users and filter by role and tenant.

    Args:
        current_user: Current super admin user
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        role: Filter by user role (super_admin, tenant_admin, or user)
        tenant_id: Filter by tenant ID
        search: Search by email

    Returns:
        List of users with tenant information
    """
    statement = select(User)

    # Filter by role if specified
    if role:
        statement = statement.where(User.role == role)

    if tenant_id is not None:
        statement = statement.where(User.tenant_id == tenant_id)
    if search:
        statement = statement.where(User.email.contains(search))

    statement = statement.offset(skip).limit(limit)
    users = db.exec(statement).all()

    result = []
    for user in users:
        # Get tenant name if user belongs to a tenant
        tenant_name = None
        if user.tenant_id:
            tenant = db.exec(select(Tenant).where(Tenant.id == user.tenant_id)).first()
            if tenant:
                tenant_name = tenant.name

        result.append({
            "id": user.id,
            "email": user.email,
            "tenant_id": user.tenant_id,
            "tenant_name": tenant_name,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        })

    return result


@router.get("/users/{user_id}", response_model=dict)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Get a single user by ID.

    Args:
        user_id: User ID
        current_user: Current super admin user
        db: Database session

    Returns:
        User details
    """
    user = db.exec(select(User).where(User.id == user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Get tenant info
    tenant_name = None
    tenant_subdomain = None
    if user.tenant_id:
        tenant = db.exec(select(Tenant).where(Tenant.id == user.tenant_id)).first()
        if tenant:
            tenant_name = tenant.name
            tenant_subdomain = tenant.subdomain

    return {
        "id": user.id,
        "email": user.email,
        "tenant_id": user.tenant_id,
        "tenant_name": tenant_name,
        "tenant_subdomain": tenant_subdomain,
        "role": user.role.value if hasattr(user.role, 'value') else user.role,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }


@router.post("/users", response_model=dict)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Create a new admin user (super_admin or tenant_admin).

    Super Admins can only create Super Admins and Tenant Admins.
    Regular users should be created by their Tenant Admin.

    Args:
        user_data: User creation data
        current_user: Current super admin user
        db: Database session

    Returns:
        Created user
    """
    from app.core.security import get_password_hash

    # Validate role
    if user_data.role not in ['super_admin', 'tenant_admin', 'user']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be super_admin, tenant_admin, or user.",
        )

    # Check if email already exists
    existing = db.exec(select(User).where(User.email == user_data.email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Validate tenant if provided
    if user_data.tenant_id:
        tenant = db.exec(select(Tenant).where(Tenant.id == user_data.tenant_id)).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found",
            )

    # Convert role string to enum
    role_map = {
        "super_admin": UserRole.SUPER_ADMIN,
        "tenant_admin": UserRole.TENANT_ADMIN,
        "user": UserRole.USER,
    }
    role_enum = role_map.get(user_data.role, UserRole.USER)

    # Create user
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role=role_enum,
        tenant_id=user_data.tenant_id,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "email": user.email,
        "tenant_id": user.tenant_id,
        "role": user.role.value if hasattr(user.role, 'value') else user.role,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.put("/users/{user_id}", response_model=dict)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Update a user.

    Args:
        user_id: User ID
        user_data: User update data
        current_user: Current super admin user
        db: Database session

    Returns:
        Updated user
    """
    from datetime import datetime

    user = db.exec(select(User).where(User.id == user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Update fields
    if user_data.email is not None:
        # Check if email is taken by another user
        existing = db.exec(
            select(User).where(User.email == user_data.email, User.id != user_id)
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        user.email = user_data.email

    if user_data.role is not None:
        role_map = {
            "super_admin": UserRole.SUPER_ADMIN,
            "tenant_admin": UserRole.TENANT_ADMIN,
            "user": UserRole.USER,
        }
        user.role = role_map.get(user_data.role, UserRole.USER)

    if user_data.is_active is not None:
        user.is_active = user_data.is_active

    if user_data.tenant_id is not None:
        if user_data.tenant_id == 0:
            user.tenant_id = None
        else:
            tenant = db.exec(select(Tenant).where(Tenant.id == user_data.tenant_id)).first()
            if not tenant:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Tenant not found",
                )
            user.tenant_id = user_data.tenant_id

    user.updated_at = datetime.utcnow()

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "email": user.email,
        "tenant_id": user.tenant_id,
        "role": user.role.value if hasattr(user.role, 'value') else user.role,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }


@router.delete("/users/{user_id}", response_model=dict)
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Delete a user.

    Args:
        user_id: User ID
        current_user: Current super admin user
        db: Database session

    Returns:
        Deletion confirmation
    """
    user = db.exec(select(User).where(User.id == user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent deleting yourself
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )

    user_email = user.email
    db.delete(user)
    db.commit()

    return {
        "message": f"User '{user_email}' deleted successfully",
    }


class PasswordReset(BaseModel):
    """Schema for password reset."""
    new_password: str


@router.post("/users/{user_id}/reset-password", response_model=dict)
async def reset_user_password(
    user_id: int,
    password_data: PasswordReset,
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Reset a user's password.

    Args:
        user_id: User ID
        password_data: New password data
        current_user: Current super admin user
        db: Database session

    Returns:
        Success confirmation
    """
    user = db.exec(select(User).where(User.id == user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
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
    tenants = db.exec(tenant_statement).all()
    total_tenants = len(tenants)

    # Count total users
    user_statement = select(User)
    total_users = len(db.exec(user_statement).all())

    # Count total QR codes across all tenant schemas
    from sqlalchemy import text
    total_qr_codes = 0

    # Get all tenant schemas from database
    schema_result = db.exec(
        text("SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'")
    ).all()

    for (schema_name,) in schema_result:
        try:
            result = db.exec(
                text(f"SELECT COUNT(*) FROM {schema_name}.qr_codes")
            ).first()
            if result:
                total_qr_codes += result[0]
        except Exception:
            # Table might not exist yet, rollback to clear the failed transaction
            db.rollback()
            pass

    return {
        "total_tenants": total_tenants,
        "active_tenants": len(db.exec(select(Tenant).where(Tenant.is_active == True)).all()),
        "total_users": total_users,
        "active_users": len(db.exec(select(User).where(User.is_active == True)).all()),
        # Placeholders for future implementation
        "total_pets": 0,
        "total_qr_codes": total_qr_codes,
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


@router.get("/qr/all", response_model=List[dict])
async def get_all_qr_codes(
    skip: int = 0,
    limit: int = 1000000,
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Get all QR codes across all tenant schemas.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        current_user: Current super admin user
        db: Database session

    Returns:
        List of all QR codes with tenant information
    """
    from sqlalchemy import text

    all_qr_codes = []

    # Get all tenant schemas
    schema_result = db.exec(
        text("SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'")
    ).all()

    # Create a mapping of schema_name to tenant info
    tenants = db.exec(select(Tenant)).all()
    tenant_map = {}
    for tenant in tenants:
        schema_name = f"tenant_{tenant.subdomain}"
        tenant_map[schema_name] = {"id": tenant.id, "name": tenant.name, "subdomain": tenant.subdomain}

    for (schema_name,) in schema_result:
        try:
            # Get QR codes from this tenant schema
            result = db.exec(
                text(f"""
                    SELECT
                        id, code, pin, pet_id, status, batch_id,
                        print_data, activated_at, created_at
                    FROM {schema_name}.qr_codes
                    ORDER BY created_at DESC
                """)
            ).all()

            tenant_info = tenant_map.get(schema_name, {"id": None, "name": schema_name, "subdomain": None})

            for row in result:
                qr_data = {
                    "id": row[0],
                    "code": row[1],
                    "pin": row[2],
                    "pet_id": row[3],
                    "status": row[4],
                    "batch_id": row[5],
                    "print_data": row[6],
                    "activated_at": row[7].isoformat() if row[7] else None,
                    "created_at": row[8].isoformat() if row[8] else None,
                    "tenant_id": tenant_info["id"],
                    "tenant_name": tenant_info["name"],
                    "tenant_subdomain": tenant_info["subdomain"],
                }
                all_qr_codes.append(qr_data)
        except Exception:
            # Table might not exist yet, rollback and continue
            db.rollback()
            continue

    # Sort by created_at desc and apply pagination
    all_qr_codes.sort(key=lambda x: x["created_at"] or "", reverse=True)

    return all_qr_codes[skip:skip + limit]
