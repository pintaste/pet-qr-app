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
        schema_name = f"tenant_{tenant.subdomain.replace('-', '_')}"

        # Check if schema exists first to avoid transaction abort
        schema_exists = db.exec(
            text(f"SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = '{schema_name}')")
        ).first()

        if schema_exists and schema_exists[0]:
            try:
                pet_result = db.exec(text(f"SELECT COUNT(*) FROM {schema_name}.pets")).first()
                qr_result = db.exec(text(f"SELECT COUNT(*) FROM {schema_name}.qr_codes")).first()
                scan_result = db.exec(text(f"SELECT COUNT(*) FROM {schema_name}.pet_scan_logs")).first()
                pet_count = pet_result[0] if pet_result else 0
                qr_count = qr_result[0] if qr_result else 0
                scan_count = scan_result[0] if scan_result else 0
            except Exception:
                # Tables might not exist yet - rollback to clear failed transaction state
                db.rollback()

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
        created_by_id=current_user.id,
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


class BulkUserDelete(BaseModel):
    """Schema for bulk user deletion."""
    user_ids: list[int]


@router.post("/users/bulk-delete", response_model=dict)
async def bulk_delete_users(
    data: BulkUserDelete,
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Delete multiple users at once.

    Args:
        data: Bulk delete data containing user IDs
        current_user: Current super admin user
        db: Database session

    Returns:
        Deletion confirmation with count
    """
    if not data.user_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No user IDs provided",
        )

    # Filter out current user from deletion list
    user_ids_to_delete = [uid for uid in data.user_ids if uid != current_user.id]

    if len(user_ids_to_delete) != len(data.user_ids):
        # User tried to delete themselves
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )

    # Fetch all users to delete
    users_to_delete = db.exec(
        select(User).where(User.id.in_(user_ids_to_delete))
    ).all()

    if not users_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No users found with provided IDs",
        )

    # Delete all users
    deleted_count = 0
    deleted_emails = []
    for user in users_to_delete:
        deleted_emails.append(user.email)
        db.delete(user)
        deleted_count += 1

    db.commit()

    return {
        "message": f"Successfully deleted {deleted_count} user(s)",
        "deleted_count": deleted_count,
        "deleted_emails": deleted_emails,
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

    # Count total pets and scans across all tenant schemas
    total_pets = 0
    total_scans = 0

    for (schema_name,) in schema_result:
        try:
            # Count pets
            pet_result = db.exec(
                text(f"SELECT COUNT(*) FROM {schema_name}.pets")
            ).first()
            if pet_result:
                total_pets += pet_result[0]

            # Count scans (sum of scan_count from qr_codes)
            scan_result = db.exec(
                text(f"SELECT COALESCE(SUM(scan_count), 0) FROM {schema_name}.qr_codes")
            ).first()
            if scan_result:
                total_scans += scan_result[0]
        except Exception:
            db.rollback()
            pass

    return {
        "total_tenants": total_tenants,
        "active_tenants": len(db.exec(select(Tenant).where(Tenant.is_active == True)).all()),
        "total_users": total_users,
        "active_users": len(db.exec(select(User).where(User.is_active == True)).all()),
        "total_pets": total_pets,
        "total_qr_codes": total_qr_codes,
        "total_scans": total_scans,
    }


@router.get("/analytics/growth")
async def get_growth_analytics(
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Get growth analytics with trends over time.

    Returns:
        Growth data for users, tenants, and QR codes
    """
    from datetime import datetime, timedelta
    from sqlalchemy import text

    now = datetime.utcnow()

    # User growth by time periods
    def count_users_since(days):
        since_date = now - timedelta(days=days)
        return len(db.exec(
            select(User).where(User.created_at >= since_date)
        ).all())

    # Tenant growth by time periods
    def count_tenants_since(days):
        since_date = now - timedelta(days=days)
        return len(db.exec(
            select(Tenant).where(Tenant.created_at >= since_date)
        ).all())

    # Get daily user registrations for last 30 days
    daily_users = []
    for i in range(30, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = len(db.exec(
            select(User).where(User.created_at >= day_start).where(User.created_at < day_end)
        ).all())
        daily_users.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "count": count
        })

    # Get daily tenant registrations for last 30 days
    daily_tenants = []
    for i in range(30, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = len(db.exec(
            select(Tenant).where(Tenant.created_at >= day_start).where(Tenant.created_at < day_end)
        ).all())
        daily_tenants.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "count": count
        })

    # User distribution by role
    all_users = db.exec(select(User)).all()
    role_distribution = {}
    for user in all_users:
        role = user.role or "user"
        role_distribution[role] = role_distribution.get(role, 0) + 1

    return {
        "user_growth": {
            "last_7_days": count_users_since(7),
            "last_30_days": count_users_since(30),
            "last_90_days": count_users_since(90),
            "daily_trend": daily_users
        },
        "tenant_growth": {
            "last_7_days": count_tenants_since(7),
            "last_30_days": count_tenants_since(30),
            "last_90_days": count_tenants_since(90),
            "daily_trend": daily_tenants
        },
        "user_role_distribution": role_distribution
    }


@router.get("/analytics/qr-status")
async def get_qr_status_analytics(
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Get QR code status distribution analytics.

    Returns:
        QR code status breakdown by tenant
    """
    from sqlalchemy import text

    # Get all tenant schemas
    schema_result = db.exec(
        text("SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'")
    ).all()

    status_counts = {
        "active": 0,
        "inactive": 0,
        "expired": 0
    }

    assigned_count = 0
    unassigned_count = 0

    tenant_breakdown = []

    # Get tenants for mapping
    tenants = {t.id: t for t in db.exec(select(Tenant)).all()}

    for (schema_name,) in schema_result:
        try:
            # Extract tenant subdomain from schema name
            subdomain = schema_name.replace("tenant_", "")
            tenant = next((t for t in tenants.values() if t.subdomain == subdomain), None)

            # Count by status
            for status_value in ["active", "inactive", "expired"]:
                result = db.exec(
                    text(f"SELECT COUNT(*) FROM {schema_name}.qr_codes WHERE status = '{status_value}'")
                ).first()
                if result:
                    status_counts[status_value] += result[0]

            # Count assigned vs unassigned
            assigned_result = db.exec(
                text(f"SELECT COUNT(*) FROM {schema_name}.qr_codes WHERE pet_id IS NOT NULL")
            ).first()
            unassigned_result = db.exec(
                text(f"SELECT COUNT(*) FROM {schema_name}.qr_codes WHERE pet_id IS NULL")
            ).first()

            if assigned_result:
                assigned_count += assigned_result[0]
            if unassigned_result:
                unassigned_count += unassigned_result[0]

            # Get total for this tenant
            total_result = db.exec(
                text(f"SELECT COUNT(*) FROM {schema_name}.qr_codes")
            ).first()

            if tenant and total_result and total_result[0] > 0:
                tenant_breakdown.append({
                    "tenant_id": tenant.id,
                    "tenant_name": tenant.name,
                    "total_qr_codes": total_result[0],
                    "assigned": assigned_result[0] if assigned_result else 0,
                    "unassigned": unassigned_result[0] if unassigned_result else 0
                })
        except Exception:
            db.rollback()
            pass

    return {
        "status_distribution": status_counts,
        "assignment": {
            "assigned": assigned_count,
            "unassigned": unassigned_count
        },
        "by_tenant": sorted(tenant_breakdown, key=lambda x: x["total_qr_codes"], reverse=True)
    }


@router.get("/analytics/tenant-performance")
async def get_tenant_performance(
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Get tenant performance metrics.

    Returns:
        Tenant performance rankings and health scores
    """
    from sqlalchemy import text
    from datetime import datetime

    tenants = db.exec(select(Tenant)).all()
    tenant_metrics = []

    for tenant in tenants:
        schema_name = f"tenant_{tenant.subdomain.replace('-', '_')}"

        # Initialize metrics
        metrics = {
            "tenant_id": tenant.id,
            "tenant_name": tenant.name,
            "subdomain": tenant.subdomain,
            "tier": tenant.tier,
            "is_active": tenant.is_active,
            "total_users": 0,
            "total_pets": 0,
            "total_qr_codes": 0,
            "total_scans": 0,
            "assigned_qr_codes": 0,
            "subscription_status": "active" if tenant.subscription_expires_at and tenant.subscription_expires_at > datetime.utcnow() else "expired"
        }

        # Count users for this tenant
        user_count = len(db.exec(
            select(User).where(User.tenant_id == tenant.id)
        ).all())
        metrics["total_users"] = user_count

        try:
            # Count pets
            pet_result = db.exec(
                text(f"SELECT COUNT(*) FROM {schema_name}.pets")
            ).first()
            if pet_result:
                metrics["total_pets"] = pet_result[0]

            # Count QR codes
            qr_result = db.exec(
                text(f"SELECT COUNT(*) FROM {schema_name}.qr_codes")
            ).first()
            if qr_result:
                metrics["total_qr_codes"] = qr_result[0]

            # Count assigned QR codes
            assigned_result = db.exec(
                text(f"SELECT COUNT(*) FROM {schema_name}.qr_codes WHERE pet_id IS NOT NULL")
            ).first()
            if assigned_result:
                metrics["assigned_qr_codes"] = assigned_result[0]

            # Sum scans
            scan_result = db.exec(
                text(f"SELECT COALESCE(SUM(scan_count), 0) FROM {schema_name}.qr_codes")
            ).first()
            if scan_result:
                metrics["total_scans"] = scan_result[0]
        except Exception:
            db.rollback()
            pass

        # Calculate engagement score (0-100)
        score = 0
        if metrics["total_qr_codes"] > 0:
            # QR utilization: 40 points
            utilization = (metrics["assigned_qr_codes"] / metrics["total_qr_codes"]) * 40
            score += utilization
        if metrics["total_users"] > 0:
            # User activity: 30 points (based on pets per user)
            pets_per_user = min(metrics["total_pets"] / metrics["total_users"], 3) / 3 * 30
            score += pets_per_user
        if metrics["total_scans"] > 0:
            # Scan activity: 30 points (capped at 100 scans)
            scan_score = min(metrics["total_scans"], 100) / 100 * 30
            score += scan_score

        metrics["engagement_score"] = round(score, 1)
        tenant_metrics.append(metrics)

    # Sort by engagement score
    tenant_metrics.sort(key=lambda x: x["engagement_score"], reverse=True)

    # Tier distribution
    tier_distribution = {}
    for tenant in tenants:
        tier = tenant.tier or "free"
        tier_distribution[tier] = tier_distribution.get(tier, 0) + 1

    return {
        "tenant_rankings": tenant_metrics,
        "tier_distribution": tier_distribution,
        "total_tenants": len(tenants),
        "active_tenants": len([t for t in tenants if t.is_active])
    }


@router.get("/analytics/activity")
async def get_recent_activity(
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Get recent platform activity.

    Returns:
        Recent users, tenants, and activity feed
    """
    from datetime import datetime, timedelta

    # Recent users (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_users = db.exec(
        select(User).where(User.created_at >= week_ago).order_by(User.created_at.desc())
    ).all()

    recent_users_list = [{
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "tenant_id": user.tenant_id,
        "created_at": user.created_at.isoformat() if user.created_at else None
    } for user in recent_users[:20]]

    # Recent tenants (last 30 days)
    month_ago = datetime.utcnow() - timedelta(days=30)
    recent_tenants = db.exec(
        select(Tenant).where(Tenant.created_at >= month_ago).order_by(Tenant.created_at.desc())
    ).all()

    recent_tenants_list = [{
        "id": tenant.id,
        "name": tenant.name,
        "subdomain": tenant.subdomain,
        "tier": tenant.tier,
        "is_active": tenant.is_active,
        "created_at": tenant.created_at.isoformat() if tenant.created_at else None
    } for tenant in recent_tenants[:10]]

    return {
        "recent_users": recent_users_list,
        "recent_tenants": recent_tenants_list,
        "summary": {
            "new_users_7d": len(recent_users),
            "new_tenants_30d": len(recent_tenants)
        }
    }


@router.get("/analytics/pets")
async def get_pet_analytics(
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Get pet type and breed analytics across all tenants.

    Returns:
        Pet type distribution, breed distribution, and per-tenant breakdown
    """
    from sqlalchemy import text

    tenants = db.exec(select(Tenant)).all()

    # Aggregate pet data
    species_distribution = {}
    breed_distribution = {}
    tenant_pet_breakdown = []
    total_pets = 0
    pets_with_photos = 0

    for tenant in tenants:
        schema_name = f"tenant_{tenant.subdomain.replace('-', '_')}"
        tenant_data = {
            "tenant_id": tenant.id,
            "tenant_name": tenant.name,
            "total_pets": 0,
            "species_breakdown": {}
        }

        try:
            # Get species distribution for this tenant
            species_result = db.exec(
                text(f"""
                    SELECT species, COUNT(*) as count
                    FROM {schema_name}.pets
                    GROUP BY species
                """)
            ).all()

            for row in species_result:
                species = row[0] or "unknown"
                count = row[1]
                species_distribution[species] = species_distribution.get(species, 0) + count
                tenant_data["species_breakdown"][species] = count
                tenant_data["total_pets"] += count
                total_pets += count

            # Get breed distribution for this tenant
            breed_result = db.exec(
                text(f"""
                    SELECT breed, COUNT(*) as count
                    FROM {schema_name}.pets
                    WHERE breed IS NOT NULL AND breed != ''
                    GROUP BY breed
                    ORDER BY count DESC
                    LIMIT 20
                """)
            ).all()

            for row in breed_result:
                breed = row[0]
                count = row[1]
                breed_distribution[breed] = breed_distribution.get(breed, 0) + count

            # Count pets with photos
            photo_result = db.exec(
                text(f"""
                    SELECT COUNT(*) FROM {schema_name}.pets
                    WHERE photo_url IS NOT NULL AND photo_url != ''
                """)
            ).first()
            if photo_result:
                pets_with_photos += photo_result[0]

        except Exception:
            db.rollback()
            continue

        if tenant_data["total_pets"] > 0:
            tenant_pet_breakdown.append(tenant_data)

    # Sort breed distribution by count and take top 15
    sorted_breeds = sorted(breed_distribution.items(), key=lambda x: x[1], reverse=True)[:15]

    return {
        "species_distribution": species_distribution,
        "breed_distribution": dict(sorted_breeds),
        "tenant_breakdown": tenant_pet_breakdown,
        "summary": {
            "total_pets": total_pets,
            "pets_with_photos": pets_with_photos,
            "photo_percentage": round((pets_with_photos / total_pets * 100) if total_pets > 0 else 0, 1)
        }
    }


@router.get("/analytics/scan-patterns")
async def get_scan_patterns(
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Get scan time dimension analytics.

    Returns:
        Hourly patterns, daily patterns, and recent scan activity
    """
    from sqlalchemy import text
    from datetime import datetime, timedelta

    tenants = db.exec(select(Tenant)).all()

    # Initialize hourly and daily counters
    hourly_pattern = {str(i): 0 for i in range(24)}
    daily_pattern = {"Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0, "Sun": 0}
    day_mapping = {0: "Mon", 1: "Tue", 2: "Wed", 3: "Thu", 4: "Fri", 5: "Sat", 6: "Sun"}

    recent_scans = []
    total_scans_30d = 0

    for tenant in tenants:
        schema_name = f"tenant_{tenant.subdomain.replace('-', '_')}"

        try:
            # Get hourly pattern from scan logs (last 30 days)
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            hourly_result = db.exec(
                text(f"""
                    SELECT EXTRACT(HOUR FROM scanned_at) as hour, COUNT(*) as count
                    FROM {schema_name}.pet_scan_logs
                    WHERE scanned_at >= :thirty_days_ago
                    GROUP BY EXTRACT(HOUR FROM scanned_at)
                """),
                {"thirty_days_ago": thirty_days_ago}
            ).all()

            for row in hourly_result:
                hour = str(int(row[0]))
                hourly_pattern[hour] += row[1]
                total_scans_30d += row[1]

            # Get daily pattern from scan logs
            daily_result = db.exec(
                text(f"""
                    SELECT EXTRACT(DOW FROM scanned_at) as dow, COUNT(*) as count
                    FROM {schema_name}.pet_scan_logs
                    WHERE scanned_at >= :thirty_days_ago
                    GROUP BY EXTRACT(DOW FROM scanned_at)
                """),
                {"thirty_days_ago": thirty_days_ago}
            ).all()

            for row in daily_result:
                dow = int(row[0])
                day_name = day_mapping.get(dow, "Unknown")
                daily_pattern[day_name] += row[1]

            # Get recent scans with pet info
            scan_result = db.exec(
                text(f"""
                    SELECT
                        psl.id,
                        psl.scanned_at,
                        psl.scanner_ip,
                        psl.scanner_location,
                        p.name as pet_name,
                        p.species
                    FROM {schema_name}.pet_scan_logs psl
                    JOIN {schema_name}.pets p ON psl.pet_id = p.id
                    ORDER BY psl.scanned_at DESC
                    LIMIT 10
                """)
            ).all()

            for row in scan_result:
                recent_scans.append({
                    "id": row[0],
                    "scanned_at": row[1].isoformat() if row[1] else None,
                    "scanner_ip": row[2],
                    "location": row[3],
                    "pet_name": row[4],
                    "species": row[5],
                    "tenant_name": tenant.name
                })

        except Exception:
            db.rollback()
            continue

    # Sort recent scans by time and take top 20
    recent_scans.sort(key=lambda x: x["scanned_at"] or "", reverse=True)
    recent_scans = recent_scans[:20]

    # Convert hourly pattern to sorted list
    hourly_list = [{"hour": int(h), "count": hourly_pattern[h]} for h in sorted(hourly_pattern.keys(), key=int)]

    # Convert daily pattern to list in order
    daily_list = [{"day": day, "count": daily_pattern[day]} for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]]

    # Find peak hours
    peak_hours = sorted(hourly_list, key=lambda x: x["count"], reverse=True)[:3]

    return {
        "hourly_pattern": hourly_list,
        "daily_pattern": daily_list,
        "recent_scans": recent_scans,
        "summary": {
            "total_scans_30d": total_scans_30d,
            "peak_hours": [h["hour"] for h in peak_hours],
            "busiest_day": max(daily_list, key=lambda x: x["count"])["day"] if total_scans_30d > 0 else None
        }
    }


@router.get("/analytics/realtime-feed")
async def get_realtime_feed(
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
    hours: int = 24,
    activity_type: str | None = None,
):
    """
    Get real-time activity feed across all tenants with pagination.

    Args:
        skip: Number of activities to skip (for pagination)
        limit: Maximum number of activities to return (default 50, max 200)
        hours: Number of hours to look back (default 24, max 2160 = 90 days)
        activity_type: Filter by activity type (user_registered, tenant_created,
                      pet_registered, qr_activated, qr_scanned)

    Returns:
        Paginated activities with total count and summary statistics
    """
    from sqlalchemy import text
    from datetime import datetime, timedelta

    # Validate and cap parameters
    limit = min(limit, 200)
    hours = min(hours, 2160)  # Max 90 days

    activity_feed = []
    time_threshold = datetime.utcnow() - timedelta(hours=hours)

    # Get recent user registrations
    recent_users = db.exec(
        select(User).where(User.created_at >= time_threshold).order_by(User.created_at.desc())
    ).all()

    for user in recent_users:
        tenant_name = None
        if user.tenant_id:
            tenant = db.exec(select(Tenant).where(Tenant.id == user.tenant_id)).first()
            tenant_name = tenant.name if tenant else None

        # Format role for display
        role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)
        role_display = role_str.replace('_', ' ').title()

        activity_feed.append({
            "type": "user_registered",
            "timestamp": user.created_at.isoformat() if user.created_at else None,
            "description": f"New user: {user.email} ({role_display})",
            "tenant_name": tenant_name,
            "user_email": user.email,
            "metadata": {
                "user_id": user.id,
                "role": user.role
            }
        })

    # Get recent tenant creations
    recent_tenants = db.exec(
        select(Tenant).where(Tenant.created_at >= time_threshold).order_by(Tenant.created_at.desc())
    ).all()

    for tenant in recent_tenants:
        # Get creator email if available
        creator_email = None
        if tenant.created_by_id:
            creator = db.exec(select(User).where(User.id == tenant.created_by_id)).first()
            creator_email = creator.email if creator else None

        # Build description with creator info
        desc = f"New tenant: {tenant.name}"
        if creator_email:
            desc += f" by {creator_email}"

        activity_feed.append({
            "type": "tenant_created",
            "timestamp": tenant.created_at.isoformat() if tenant.created_at else None,
            "description": desc,
            "tenant_name": tenant.name,
            "user_email": creator_email,
            "metadata": {
                "tenant_id": tenant.id,
                "subdomain": tenant.subdomain,
                "tier": tenant.tier
            }
        })

    # Get recent pet registrations and QR scans from tenant schemas
    tenants = db.exec(select(Tenant)).all()

    for tenant in tenants:
        schema_name = f"tenant_{tenant.subdomain.replace('-', '_')}"

        try:
            # Recent pets
            pet_result = db.exec(
                text(f"""
                    SELECT id, name, species, created_at
                    FROM {schema_name}.pets
                    WHERE created_at >= :since
                    ORDER BY created_at DESC
                """),
                {"since": time_threshold}
            ).all()

            for row in pet_result:
                activity_feed.append({
                    "type": "pet_registered",
                    "timestamp": row[3].isoformat() if row[3] else None,
                    "description": f"New pet registered: {row[1]} ({row[2]})",
                    "tenant_name": tenant.name,
                    "metadata": {
                        "pet_id": row[0],
                        "pet_name": row[1],
                        "species": row[2]
                    }
                })

            # Recent QR activations (when pet_id is assigned)
            qr_result = db.exec(
                text(f"""
                    SELECT q.id, q.short_code, p.name as pet_name, q.updated_at
                    FROM {schema_name}.qr_codes q
                    JOIN {schema_name}.pets p ON q.pet_id = p.id
                    WHERE q.updated_at >= :since AND q.pet_id IS NOT NULL
                    ORDER BY q.updated_at DESC
                """),
                {"since": time_threshold}
            ).all()

            for row in qr_result:
                activity_feed.append({
                    "type": "qr_activated",
                    "timestamp": row[3].isoformat() if row[3] else None,
                    "description": f"QR code linked to pet: {row[2]}",
                    "tenant_name": tenant.name,
                    "metadata": {
                        "qr_id": row[0],
                        "short_code": row[1],
                        "pet_name": row[2]
                    }
                })

            # Recent scans
            scan_result = db.exec(
                text(f"""
                    SELECT psl.id, psl.scanned_at, p.name, psl.scanner_location
                    FROM {schema_name}.pet_scan_logs psl
                    JOIN {schema_name}.pets p ON psl.pet_id = p.id
                    WHERE psl.scanned_at >= :since
                    ORDER BY psl.scanned_at DESC
                """),
                {"since": time_threshold}
            ).all()

            for row in scan_result:
                location_str = f" from {row[3]}" if row[3] else ""
                activity_feed.append({
                    "type": "qr_scanned",
                    "timestamp": row[1].isoformat() if row[1] else None,
                    "description": f"QR scanned for pet: {row[2]}{location_str}",
                    "tenant_name": tenant.name,
                    "metadata": {
                        "scan_id": row[0],
                        "pet_name": row[2],
                        "location": row[3]
                    }
                })

        except Exception:
            db.rollback()
            continue

    # Sort by timestamp
    activity_feed.sort(key=lambda x: x["timestamp"] or "", reverse=True)

    # Apply activity type filter if specified
    if activity_type:
        valid_types = ["user_registered", "tenant_created", "pet_registered", "qr_activated", "qr_scanned"]
        if activity_type in valid_types:
            activity_feed = [a for a in activity_feed if a["type"] == activity_type]

    # Calculate total before pagination
    total_count = len(activity_feed)

    # Apply pagination
    paginated_activities = activity_feed[skip:skip + limit]

    # Calculate summary from total (before pagination)
    return {
        "activities": paginated_activities,
        "pagination": {
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "has_more": skip + limit < total_count
        },
        "summary": {
            "total_activities_24h": total_count,
            "user_registrations": len([a for a in activity_feed if a["type"] == "user_registered"]),
            "tenant_registrations": len([a for a in activity_feed if a["type"] == "tenant_created"]),
            "pet_registrations": len([a for a in activity_feed if a["type"] == "pet_registered"]),
            "qr_activations": len([a for a in activity_feed if a["type"] == "qr_activated"]),
            "qr_scans": len([a for a in activity_feed if a["type"] == "qr_scanned"])
        },
        "filter": {
            "hours": hours,
            "activity_type": activity_type
        }
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
        schema_name = f"tenant_{tenant.subdomain.replace('-', '_')}"
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


# =============================================================================
# Subscription Management Endpoints (Option B, C, D)
# =============================================================================

class SubscriptionUpdate(BaseModel):
    """Request model for updating a tenant's subscription."""
    tier: Optional[str] = None
    subscription_expires_at: Optional[str] = None
    is_active: Optional[bool] = None
    extend_days: Optional[int] = None  # Convenience field to extend by X days


class FeatureLimitsUpdate(BaseModel):
    """Request model for updating a tenant's feature limits."""
    max_pets: Optional[int] = None
    max_qr_codes: Optional[int] = None
    max_users: Optional[int] = None
    max_storage_mb: Optional[int] = None
    features: Optional[dict] = None  # e.g., {"analytics": true, "export": true}


@router.get("/subscriptions/overview")
async def get_subscription_overview(
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Get subscription overview for all tenants (Option B).

    Returns:
        Subscription status summary, tier distribution, revenue insights,
        and list of tenants with subscription details
    """
    from datetime import datetime, timedelta
    from sqlalchemy import text

    tenants = db.exec(select(Tenant)).all()
    now = datetime.utcnow()

    # Initialize counters
    tier_distribution = {}
    status_counts = {
        "active": 0,
        "expiring_soon": 0,  # Within 7 days
        "expiring_month": 0,  # Within 30 days
        "expired": 0,
        "no_subscription": 0
    }

    tenant_subscriptions = []

    for tenant in tenants:
        tier = tenant.tier.value if hasattr(tenant.tier, 'value') else str(tenant.tier)
        tier_distribution[tier] = tier_distribution.get(tier, 0) + 1

        # Determine subscription status
        sub_status = "no_subscription"
        days_remaining = None

        if tenant.subscription_expires_at:
            if tenant.subscription_expires_at > now:
                days_remaining = (tenant.subscription_expires_at - now).days
                if days_remaining <= 7:
                    sub_status = "expiring_soon"
                    status_counts["expiring_soon"] += 1
                elif days_remaining <= 30:
                    sub_status = "expiring_month"
                    status_counts["expiring_month"] += 1
                else:
                    sub_status = "active"
                    status_counts["active"] += 1
            else:
                sub_status = "expired"
                status_counts["expired"] += 1
                days_remaining = (tenant.subscription_expires_at - now).days  # Negative
        else:
            status_counts["no_subscription"] += 1

        # Count users for this tenant
        user_count = len(db.exec(
            select(User).where(User.tenant_id == tenant.id)
        ).all())

        # Get resource usage from tenant schema
        pet_count = 0
        qr_count = 0
        try:
            schema_name = f"tenant_{tenant.subdomain.replace('-', '_')}"
            pet_result = db.exec(text(f"SELECT COUNT(*) FROM {schema_name}.pets")).first()
            qr_result = db.exec(text(f"SELECT COUNT(*) FROM {schema_name}.qr_codes")).first()
            pet_count = pet_result[0] if pet_result else 0
            qr_count = qr_result[0] if qr_result else 0
        except Exception:
            db.rollback()

        # Get feature limits from settings
        limits = tenant.settings.get("limits", {}) if tenant.settings else {}

        tenant_subscriptions.append({
            "tenant_id": tenant.id,
            "tenant_name": tenant.name,
            "subdomain": tenant.subdomain,
            "tier": tier,
            "is_active": tenant.is_active,
            "subscription_status": sub_status,
            "subscription_expires_at": tenant.subscription_expires_at.isoformat() if tenant.subscription_expires_at else None,
            "days_remaining": days_remaining,
            "user_count": user_count,
            "pet_count": pet_count,
            "qr_count": qr_count,
            "feature_limits": limits,
            "created_at": tenant.created_at.isoformat() if tenant.created_at else None
        })

    # Sort by expiration (expiring soonest first, then no subscription)
    def sort_key(t):
        if t["days_remaining"] is None:
            return (1, 9999)  # No subscription at end
        return (0, t["days_remaining"])

    tenant_subscriptions.sort(key=sort_key)

    # Revenue estimation (placeholder - would come from payment system)
    tier_pricing = {
        "standard": 29.99,
        "enterprise": 99.99,
        "free": 0
    }
    estimated_mrr = sum(
        tier_pricing.get(t["tier"], 0)
        for t in tenant_subscriptions
        if t["subscription_status"] in ["active", "expiring_soon", "expiring_month"]
    )

    return {
        "summary": {
            "total_tenants": len(tenants),
            "active_subscriptions": status_counts["active"] + status_counts["expiring_soon"] + status_counts["expiring_month"],
            "expiring_soon": status_counts["expiring_soon"],
            "expiring_month": status_counts["expiring_month"],
            "expired": status_counts["expired"],
            "no_subscription": status_counts["no_subscription"],
            "estimated_mrr": round(estimated_mrr, 2)
        },
        "tier_distribution": tier_distribution,
        "status_breakdown": status_counts,
        "tenants": tenant_subscriptions
    }


@router.put("/subscriptions/{tenant_id}")
async def update_tenant_subscription(
    tenant_id: int,
    subscription_data: SubscriptionUpdate,
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Update a tenant's subscription (Option C - Manual Actions).

    Supports:
    - Tier upgrade/downgrade
    - Subscription extension
    - Activation/deactivation

    Args:
        tenant_id: Tenant ID
        subscription_data: Subscription update data
        current_user: Current super admin user
        db: Database session

    Returns:
        Updated tenant subscription info
    """
    from datetime import datetime, timedelta
    from app.models.shared import TenantTier

    tenant = db.exec(select(Tenant).where(Tenant.id == tenant_id)).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )

    # Track changes for audit log
    changes = []

    # Update tier if provided
    if subscription_data.tier is not None:
        old_tier = tenant.tier.value if hasattr(tenant.tier, 'value') else tenant.tier
        tier_enum = TenantTier.STANDARD if subscription_data.tier == "standard" else TenantTier.ENTERPRISE
        tenant.tier = tier_enum
        changes.append(f"tier: {old_tier} -> {subscription_data.tier}")

    # Update expiration date if provided
    if subscription_data.subscription_expires_at is not None:
        old_expires = tenant.subscription_expires_at.isoformat() if tenant.subscription_expires_at else None
        if subscription_data.subscription_expires_at:
            tenant.subscription_expires_at = datetime.fromisoformat(
                subscription_data.subscription_expires_at.replace('Z', '+00:00')
            )
        else:
            tenant.subscription_expires_at = None
        new_expires = tenant.subscription_expires_at.isoformat() if tenant.subscription_expires_at else None
        changes.append(f"expires: {old_expires} -> {new_expires}")

    # Extend subscription by X days
    if subscription_data.extend_days is not None and subscription_data.extend_days > 0:
        base_date = tenant.subscription_expires_at or datetime.utcnow()
        # If subscription is expired, extend from today
        if base_date < datetime.utcnow():
            base_date = datetime.utcnow()
        tenant.subscription_expires_at = base_date + timedelta(days=subscription_data.extend_days)
        changes.append(f"extended by {subscription_data.extend_days} days")

    # Update active status if provided
    if subscription_data.is_active is not None:
        old_active = tenant.is_active
        tenant.is_active = subscription_data.is_active
        changes.append(f"is_active: {old_active} -> {subscription_data.is_active}")

    tenant.updated_at = datetime.utcnow()

    db.add(tenant)
    db.commit()
    db.refresh(tenant)

    # Calculate days remaining
    days_remaining = None
    if tenant.subscription_expires_at:
        days_remaining = (tenant.subscription_expires_at - datetime.utcnow()).days

    return {
        "tenant_id": tenant.id,
        "tenant_name": tenant.name,
        "subdomain": tenant.subdomain,
        "tier": tenant.tier.value if hasattr(tenant.tier, 'value') else tenant.tier,
        "is_active": tenant.is_active,
        "subscription_expires_at": tenant.subscription_expires_at.isoformat() if tenant.subscription_expires_at else None,
        "days_remaining": days_remaining,
        "updated_at": tenant.updated_at.isoformat() if tenant.updated_at else None,
        "changes": changes,
        "message": f"Subscription updated for tenant '{tenant.name}'"
    }


@router.get("/subscriptions/{tenant_id}/limits")
async def get_tenant_feature_limits(
    tenant_id: int,
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Get a tenant's current feature limits and usage (Option D).

    Returns:
        Feature limits configuration and current usage
    """
    from sqlalchemy import text

    tenant = db.exec(select(Tenant).where(Tenant.id == tenant_id)).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )

    # Get current limits from settings
    settings = tenant.settings or {}
    limits = settings.get("limits", {})

    # Default limits based on tier
    tier = tenant.tier.value if hasattr(tenant.tier, 'value') else str(tenant.tier)
    default_limits = {
        "standard": {
            "max_pets": 50,
            "max_qr_codes": 100,
            "max_users": 5,
            "max_storage_mb": 500,
            "features": {
                "analytics": False,
                "export": False,
                "custom_domain": False,
                "api_access": False
            }
        },
        "enterprise": {
            "max_pets": 500,
            "max_qr_codes": 1000,
            "max_users": 50,
            "max_storage_mb": 5000,
            "features": {
                "analytics": True,
                "export": True,
                "custom_domain": True,
                "api_access": True
            }
        }
    }

    # Merge default limits with custom limits
    tier_defaults = default_limits.get(tier, default_limits["standard"])
    effective_limits = {
        "max_pets": limits.get("max_pets", tier_defaults["max_pets"]),
        "max_qr_codes": limits.get("max_qr_codes", tier_defaults["max_qr_codes"]),
        "max_users": limits.get("max_users", tier_defaults["max_users"]),
        "max_storage_mb": limits.get("max_storage_mb", tier_defaults["max_storage_mb"]),
        "features": {**tier_defaults["features"], **limits.get("features", {})}
    }

    # Get current usage
    usage = {
        "pets": 0,
        "qr_codes": 0,
        "users": 0,
        "storage_mb": 0
    }

    # Count users
    usage["users"] = len(db.exec(
        select(User).where(User.tenant_id == tenant.id)
    ).all())

    # Count pets and QR codes from tenant schema
    try:
        schema_name = f"tenant_{tenant.subdomain.replace('-', '_')}"
        pet_result = db.exec(text(f"SELECT COUNT(*) FROM {schema_name}.pets")).first()
        qr_result = db.exec(text(f"SELECT COUNT(*) FROM {schema_name}.qr_codes")).first()
        usage["pets"] = pet_result[0] if pet_result else 0
        usage["qr_codes"] = qr_result[0] if qr_result else 0
        # Storage would require actual file size calculation
        usage["storage_mb"] = 0  # Placeholder
    except Exception:
        db.rollback()

    # Calculate usage percentages
    usage_percentage = {
        "pets": round((usage["pets"] / effective_limits["max_pets"]) * 100, 1) if effective_limits["max_pets"] > 0 else 0,
        "qr_codes": round((usage["qr_codes"] / effective_limits["max_qr_codes"]) * 100, 1) if effective_limits["max_qr_codes"] > 0 else 0,
        "users": round((usage["users"] / effective_limits["max_users"]) * 100, 1) if effective_limits["max_users"] > 0 else 0,
        "storage_mb": round((usage["storage_mb"] / effective_limits["max_storage_mb"]) * 100, 1) if effective_limits["max_storage_mb"] > 0 else 0
    }

    return {
        "tenant_id": tenant.id,
        "tenant_name": tenant.name,
        "tier": tier,
        "limits": effective_limits,
        "usage": usage,
        "usage_percentage": usage_percentage,
        "is_custom": bool(limits),  # True if tenant has custom limits
        "at_limit": any(p >= 100 for p in usage_percentage.values())
    }


@router.put("/subscriptions/{tenant_id}/limits")
async def update_tenant_feature_limits(
    tenant_id: int,
    limits_data: FeatureLimitsUpdate,
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Update a tenant's feature limits (Option D).

    Allows setting custom limits that override tier defaults.

    Args:
        tenant_id: Tenant ID
        limits_data: Feature limits update data
        current_user: Current super admin user
        db: Database session

    Returns:
        Updated feature limits
    """
    from datetime import datetime

    tenant = db.exec(select(Tenant).where(Tenant.id == tenant_id)).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )

    # Get current settings
    settings = tenant.settings or {}
    limits = settings.get("limits", {})

    # Update limits
    changes = []
    if limits_data.max_pets is not None:
        old_val = limits.get("max_pets", "default")
        limits["max_pets"] = limits_data.max_pets
        changes.append(f"max_pets: {old_val} -> {limits_data.max_pets}")

    if limits_data.max_qr_codes is not None:
        old_val = limits.get("max_qr_codes", "default")
        limits["max_qr_codes"] = limits_data.max_qr_codes
        changes.append(f"max_qr_codes: {old_val} -> {limits_data.max_qr_codes}")

    if limits_data.max_users is not None:
        old_val = limits.get("max_users", "default")
        limits["max_users"] = limits_data.max_users
        changes.append(f"max_users: {old_val} -> {limits_data.max_users}")

    if limits_data.max_storage_mb is not None:
        old_val = limits.get("max_storage_mb", "default")
        limits["max_storage_mb"] = limits_data.max_storage_mb
        changes.append(f"max_storage_mb: {old_val} -> {limits_data.max_storage_mb}")

    if limits_data.features is not None:
        current_features = limits.get("features", {})
        for key, value in limits_data.features.items():
            old_val = current_features.get(key, "default")
            current_features[key] = value
            changes.append(f"feature.{key}: {old_val} -> {value}")
        limits["features"] = current_features

    # Update tenant settings
    settings["limits"] = limits
    tenant.settings = settings
    tenant.updated_at = datetime.utcnow()

    db.add(tenant)
    db.commit()
    db.refresh(tenant)

    return {
        "tenant_id": tenant.id,
        "tenant_name": tenant.name,
        "limits": limits,
        "changes": changes,
        "updated_at": tenant.updated_at.isoformat() if tenant.updated_at else None,
        "message": f"Feature limits updated for tenant '{tenant.name}'"
    }


@router.delete("/subscriptions/{tenant_id}/limits")
async def reset_tenant_feature_limits(
    tenant_id: int,
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Reset a tenant's feature limits to tier defaults.

    Args:
        tenant_id: Tenant ID
        current_user: Current super admin user
        db: Database session

    Returns:
        Confirmation message
    """
    from datetime import datetime

    tenant = db.exec(select(Tenant).where(Tenant.id == tenant_id)).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )

    # Remove custom limits from settings
    settings = tenant.settings or {}
    if "limits" in settings:
        del settings["limits"]
        tenant.settings = settings
        tenant.updated_at = datetime.utcnow()
        db.add(tenant)
        db.commit()

    return {
        "tenant_id": tenant.id,
        "tenant_name": tenant.name,
        "message": f"Feature limits reset to tier defaults for tenant '{tenant.name}'"
    }


@router.get("/subscriptions/expiring")
async def get_expiring_subscriptions(
    days: int = 30,
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
):
    """
    Get list of subscriptions expiring within specified days.

    Useful for proactive renewal outreach.

    Args:
        days: Number of days to look ahead (default 30)
        current_user: Current super admin user
        db: Database session

    Returns:
        List of tenants with expiring subscriptions
    """
    from datetime import datetime, timedelta

    now = datetime.utcnow()
    cutoff = now + timedelta(days=days)

    tenants = db.exec(
        select(Tenant).where(
            Tenant.subscription_expires_at != None,
            Tenant.subscription_expires_at <= cutoff,
            Tenant.subscription_expires_at > now
        )
    ).all()

    result = []
    for tenant in tenants:
        days_remaining = (tenant.subscription_expires_at - now).days

        # Get contact info (tenant admin email)
        admin = db.exec(
            select(User).where(
                User.tenant_id == tenant.id,
                User.role == UserRole.TENANT_ADMIN
            )
        ).first()

        result.append({
            "tenant_id": tenant.id,
            "tenant_name": tenant.name,
            "subdomain": tenant.subdomain,
            "tier": tenant.tier.value if hasattr(tenant.tier, 'value') else tenant.tier,
            "subscription_expires_at": tenant.subscription_expires_at.isoformat(),
            "days_remaining": days_remaining,
            "admin_email": admin.email if admin else None,
            "urgency": "critical" if days_remaining <= 7 else "warning" if days_remaining <= 14 else "notice"
        })

    # Sort by days remaining (most urgent first)
    result.sort(key=lambda x: x["days_remaining"])

    return {
        "count": len(result),
        "tenants": result,
        "summary": {
            "critical": len([t for t in result if t["urgency"] == "critical"]),
            "warning": len([t for t in result if t["urgency"] == "warning"]),
            "notice": len([t for t in result if t["urgency"] == "notice"])
        }
    }


# =============================================================================
# Platform Settings Management
# =============================================================================

class PlatformSettingsResponse(BaseModel):
    """Response model for platform settings."""
    # Platform Configuration (Option A)
    app_name: str
    app_version: str
    environment: str
    debug_mode: bool
    maintenance_mode: bool = False

    # Security Settings (Option B)
    access_token_expire_minutes: int
    refresh_token_expire_days: int
    cors_origins: list[str]
    rate_limit_per_minute: int
    scan_rate_limit_per_hour: int

    # Tenant Defaults (Option F)
    tenant_defaults: dict

    # Read-only info
    database_connected: bool = True
    redis_connected: bool = True


class PlatformSettingsUpdate(BaseModel):
    """Request model for updating platform settings."""
    # Platform Configuration
    maintenance_mode: bool | None = None

    # Security Settings
    access_token_expire_minutes: int | None = None
    refresh_token_expire_days: int | None = None
    cors_origins: list[str] | None = None
    rate_limit_per_minute: int | None = None
    scan_rate_limit_per_hour: int | None = None

    # Tenant Defaults
    tenant_defaults: dict | None = None


class TenantDefaultsConfig(BaseModel):
    """Configuration for default tenant settings."""
    standard_tier: dict = {
        "max_pets": 10,
        "max_qr_codes": 20,
        "max_users": 5,
        "max_storage_mb": 100,
        "features": {
            "analytics": False,
            "export": False,
            "custom_domain": False,
            "api_access": False
        }
    }
    enterprise_tier: dict = {
        "max_pets": 1000,
        "max_qr_codes": 5000,
        "max_users": 100,
        "max_storage_mb": 10000,
        "features": {
            "analytics": True,
            "export": True,
            "custom_domain": True,
            "api_access": True
        }
    }


# In-memory storage for dynamic settings (in production, use database)
_dynamic_settings = {
    "maintenance_mode": False,
    "tenant_defaults": TenantDefaultsConfig().model_dump()
}


@router.get("/settings/platform", tags=["settings"])
async def get_platform_settings(
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
) -> PlatformSettingsResponse:
    """
    Get all platform settings.

    Returns current configuration including:
    - Platform configuration
    - Security settings
    - Tenant defaults
    - System status

    Args:
        current_user: Authenticated super admin user
        db: Database session

    Returns:
        Platform settings response
    """
    from app.core.config import settings

    # Check database connection
    db_connected = True
    try:
        db.exec(select(Tenant).limit(1)).first()
    except Exception:
        db_connected = False

    # Check Redis connection (simplified - just return True for now)
    redis_connected = True

    return PlatformSettingsResponse(
        # Platform Configuration
        app_name=settings.APP_NAME,
        app_version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        debug_mode=settings.DEBUG,
        maintenance_mode=_dynamic_settings.get("maintenance_mode", False),

        # Security Settings
        access_token_expire_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        refresh_token_expire_days=settings.REFRESH_TOKEN_EXPIRE_DAYS,
        cors_origins=settings.get_cors_origins(),
        rate_limit_per_minute=settings.RATE_LIMIT_PER_MINUTE,
        scan_rate_limit_per_hour=settings.SCAN_RATE_LIMIT_PER_HOUR,

        # Tenant Defaults
        tenant_defaults=_dynamic_settings.get("tenant_defaults", TenantDefaultsConfig().model_dump()),

        # System Status
        database_connected=db_connected,
        redis_connected=redis_connected
    )


@router.put("/settings/platform", tags=["settings"])
async def update_platform_settings(
    updates: PlatformSettingsUpdate,
    current_user: User = Depends(get_current_super_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    Update platform settings.

    Only updates the provided fields. Sensitive settings (SECRET_KEY, passwords)
    cannot be changed through this endpoint.

    Args:
        updates: Settings to update
        current_user: Authenticated super admin user
        db: Database session

    Returns:
        Updated settings and change summary
    """
    changes = []

    # Update maintenance mode
    if updates.maintenance_mode is not None:
        old_value = _dynamic_settings.get("maintenance_mode", False)
        _dynamic_settings["maintenance_mode"] = updates.maintenance_mode
        if old_value != updates.maintenance_mode:
            changes.append(f"maintenance_mode: {old_value} → {updates.maintenance_mode}")

    # Update tenant defaults
    if updates.tenant_defaults is not None:
        _dynamic_settings["tenant_defaults"] = updates.tenant_defaults
        changes.append("tenant_defaults updated")

    # Note: In production, these would update environment variables or database
    # For now, we log what would be changed

    if updates.access_token_expire_minutes is not None:
        changes.append(f"access_token_expire_minutes: would update to {updates.access_token_expire_minutes}")

    if updates.refresh_token_expire_days is not None:
        changes.append(f"refresh_token_expire_days: would update to {updates.refresh_token_expire_days}")

    if updates.cors_origins is not None:
        changes.append(f"cors_origins: would update to {updates.cors_origins}")

    if updates.rate_limit_per_minute is not None:
        changes.append(f"rate_limit_per_minute: would update to {updates.rate_limit_per_minute}")

    if updates.scan_rate_limit_per_hour is not None:
        changes.append(f"scan_rate_limit_per_hour: would update to {updates.scan_rate_limit_per_hour}")

    return {
        "message": "Settings updated successfully" if changes else "No changes made",
        "changes": changes,
        "updated_at": datetime.utcnow().isoformat()
    }


@router.get("/settings/tenant-defaults", tags=["settings"])
async def get_tenant_defaults(
    current_user: User = Depends(get_current_super_user),
) -> dict:
    """
    Get default settings for new tenants by tier.

    Returns:
        Default settings for standard and enterprise tiers
    """
    return _dynamic_settings.get("tenant_defaults", TenantDefaultsConfig().model_dump())


@router.put("/settings/tenant-defaults", tags=["settings"])
async def update_tenant_defaults(
    defaults: TenantDefaultsConfig,
    current_user: User = Depends(get_current_super_user),
) -> dict:
    """
    Update default settings for new tenants.

    Args:
        defaults: New default settings by tier
        current_user: Authenticated super admin user

    Returns:
        Updated defaults
    """
    _dynamic_settings["tenant_defaults"] = defaults.model_dump()

    return {
        "message": "Tenant defaults updated successfully",
        "tenant_defaults": _dynamic_settings["tenant_defaults"],
        "updated_at": datetime.utcnow().isoformat()
    }


@router.post("/settings/maintenance-mode", tags=["settings"])
async def toggle_maintenance_mode(
    enabled: bool,
    current_user: User = Depends(get_current_super_user),
) -> dict:
    """
    Toggle maintenance mode for the platform.

    When enabled, non-admin users will see a maintenance page.

    Args:
        enabled: Whether to enable maintenance mode
        current_user: Authenticated super admin user

    Returns:
        Current maintenance mode status
    """
    _dynamic_settings["maintenance_mode"] = enabled

    return {
        "maintenance_mode": enabled,
        "message": f"Maintenance mode {'enabled' if enabled else 'disabled'}",
        "updated_at": datetime.utcnow().isoformat()
    }
