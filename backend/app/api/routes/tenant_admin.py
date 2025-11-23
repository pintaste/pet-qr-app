"""
Tenant Admin API routes.

These endpoints are accessible to TENANT_ADMIN and SUPER_ADMIN roles.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, text
from pydantic import BaseModel

from app.core.dependencies import get_current_tenant_admin, get_db
from app.models.shared import User, UserRole, Tenant

router = APIRouter()


def get_tenant_schema(db: Session, tenant_id: int) -> str:
    """
    Get the schema name for a tenant.

    Args:
        db: Database session
        tenant_id: Tenant ID

    Returns:
        Schema name string
    """
    tenant = db.exec(select(Tenant).where(Tenant.id == tenant_id)).first()
    if tenant:
        # Schema name is derived from subdomain (Tenant model doesn't have schema_name field)
        # Replace hyphens with underscores for valid PostgreSQL schema names
        return f"tenant_{tenant.subdomain.replace('-', '_')}"
    return "tenant_demo"


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

    # Get tenant schema for querying pets and QR codes
    tenant_schema = get_tenant_schema(db, tenant_id)

    result = []
    for user in users:
        # Get tenant user ID for this user
        tenant_user_result = db.execute(
            text(f'SELECT id FROM "{tenant_schema}".tenant_users WHERE email = :email'),
            {"email": user.email}
        ).fetchone()

        if not tenant_user_result:
            # User doesn't exist in tenant schema yet
            result.append({
                "id": user.id,
                "email": user.email,
                "role": user.role.value if hasattr(user.role, 'value') else user.role,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "pet_count": 0,
                "qr_count": 0,
            })
            continue

        tenant_user_id = tenant_user_result[0]

        # Get pet count for this user
        pet_count_result = db.execute(
            text(f"""
                SELECT COUNT(*) FROM "{tenant_schema}".pets p
                WHERE p.owner_id = :tenant_user_id
            """),
            {"tenant_user_id": tenant_user_id}
        ).scalar() or 0

        # Get QR code count for this user
        # QR codes that are either:
        # 1. Linked to pets owned by this user, OR
        # 2. Activated by this user (even if not linked to a pet)
        # This matches the logic in get_qr_codes_by_owner
        qr_count_result = db.execute(
            text(f"""
                SELECT COUNT(DISTINCT qr.id) FROM "{tenant_schema}".qr_codes qr
                LEFT JOIN "{tenant_schema}".pets p ON qr.pet_id = p.id
                WHERE p.owner_id = :tenant_user_id OR qr.activated_by_user_id = :tenant_user_id
            """),
            {"tenant_user_id": tenant_user_id}
        ).scalar() or 0

        result.append({
            "id": user.id,
            "email": user.email,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "pet_count": pet_count_result,
            "qr_count": qr_count_result,
        })

    return result


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

    This performs a cascading delete:
    1. Unlinks all QR codes owned by the user (increments activation_count)
    2. Deletes all pets owned by the user
    3. Deletes the user

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
    tenant_schema = get_tenant_schema(db, current_user.tenant_id)

    # Step 1: Unlink QR codes and increment activation_count
    # Reset QR codes to inactive state (available for reuse)
    db.exec(
        text(f"""
            UPDATE "{tenant_schema}".qr_codes
            SET
                pet_id = NULL,
                activated_by_user_id = NULL,
                activated_at = NULL,
                status = 'inactive',
                activation_count = activation_count + 1
            WHERE activated_by_user_id = :user_id
        """),
        {"user_id": user_id}
    )

    # Step 2: Delete pets owned by user
    db.exec(
        text(f'DELETE FROM "{tenant_schema}".pets WHERE owner_id = :user_id'),
        {"user_id": user_id}
    )

    # Step 3: Delete the user
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

    # Get tenant schema name for raw SQL queries
    schema_name = get_tenant_schema(db, tenant_id)

    # Count pets using schema-qualified raw SQL
    pets_result = db.execute(
        text(f'SELECT COUNT(*) FROM "{schema_name}".pets')
    ).scalar()
    total_pets = pets_result or 0

    # Count QR codes using schema-qualified raw SQL
    qr_total_result = db.execute(
        text(f'SELECT COUNT(*) FROM "{schema_name}".qr_codes')
    ).scalar()
    total_qr_codes = qr_total_result or 0

    qr_active_result = db.execute(
        text(f"SELECT COUNT(*) FROM \"{schema_name}\".qr_codes WHERE status = 'ACTIVE'")
    ).scalar()
    active_qr_codes = qr_active_result or 0

    # Count total scans from scan_events table
    scans_result = db.execute(
        text(f'SELECT COUNT(*) FROM "{schema_name}".scan_events')
    ).scalar()
    total_scans = scans_result or 0

    return {
        "tenant_id": tenant_id,
        "total_users": total_users,
        "active_users": active_users,
        "total_pets": total_pets,
        "total_qr_codes": total_qr_codes,
        "active_qr_codes": active_qr_codes,
        "total_scans": total_scans,
    }


@router.get("/pets", response_model=List[dict])
async def list_tenant_pets(
    current_user: User = Depends(get_current_tenant_admin),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    species: Optional[str] = None,
):
    """
    List all pets in the current tenant.

    Args:
        current_user: Current tenant admin user
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        search: Search by pet name
        species: Filter by pet type (dog, cat, etc.)

    Returns:
        List of pets in this tenant with owner information
    """
    tenant_id = current_user.tenant_id
    schema_name = get_tenant_schema(db, tenant_id)

    # Build SQL query with schema-qualified table name
    where_clauses = []
    params = {}

    if search:
        where_clauses.append("name ILIKE :search")
        params["search"] = f"%{search}%"

    if species and species != 'all':
        where_clauses.append("species = :species")
        params["species"] = species

    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
    params["skip"] = skip
    params["limit"] = limit

    # Query pets using schema-qualified raw SQL
    # Note: Using actual DB column names (species, sex, profile_image_url, birthday)
    pets_sql = f'''
        SELECT id, name, species, breed, sex, size, color, birthday,
               profile_image_url, is_pinned, owner_id, created_at, qr_code_id
        FROM "{schema_name}".pets
        WHERE {where_sql}
        ORDER BY created_at DESC
        OFFSET :skip LIMIT :limit
    '''

    pets_result = db.execute(text(pets_sql), params).fetchall()

    # Get owner information for each pet
    result = []
    for pet in pets_result:
        # Get owner email from tenant schema (tenant_users table)
        owner_sql = f'SELECT email FROM "{schema_name}".tenant_users WHERE id = :owner_id'
        owner_result = db.execute(text(owner_sql), {"owner_id": pet[10]}).fetchone()
        owner_email = owner_result[0] if owner_result else "Unknown"

        result.append({
            "id": pet[0],
            "name": pet[1],
            "pet_type": pet[2],  # species mapped to pet_type for frontend
            "breed": pet[3],
            "gender": pet[4],   # sex mapped to gender for frontend
            "size": pet[5],
            "color": pet[6],
            "birth_date": pet[7].isoformat() if pet[7] else None,
            "profile_photo_url": pet[8],
            "is_lost": pet[9],  # is_pinned mapped to is_lost (keeping for compatibility)
            "owner_id": pet[10],
            "owner_email": owner_email,
            "created_at": pet[11].isoformat() if pet[11] else None,
            "qr_code_id": pet[12],
        })

    return result


@router.get("/qr-codes", response_model=List[dict])
async def list_tenant_qr_codes(
    current_user: User = Depends(get_current_tenant_admin),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    search: Optional[str] = None,
):
    """
    List all QR codes in the current tenant.

    This is a dedicated endpoint for Tenant Admin dashboard.

    Args:
        current_user: Current tenant admin user
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        status: Filter by status (active, inactive, pending)
        search: Search by QR code

    Returns:
        List of QR codes in this tenant with pet and user information
    """
    tenant_id = current_user.tenant_id
    schema_name = get_tenant_schema(db, tenant_id)

    # Build SQL query with schema-qualified table name
    where_clauses = ["1=1"]
    params = {}

    if status and status != 'all':
        where_clauses.append("qr.status = :status")
        params["status"] = status

    if search:
        where_clauses.append("qr.code ILIKE :search")
        params["search"] = f"%{search}%"

    where_sql = " AND ".join(where_clauses)
    params["skip"] = skip
    params["limit"] = limit

    # Query QR codes with pet names using schema-qualified raw SQL
    qr_sql = f'''
        SELECT
            qr.id,
            qr.code,
            qr.pin,
            qr.status,
            qr.pet_id,
            qr.batch_id,
            qr.activated_at,
            qr.activated_by_user_id,
            qr.created_at,
            p.name as pet_name,
            qr.activation_count
        FROM "{schema_name}".qr_codes qr
        LEFT JOIN "{schema_name}".pets p ON qr.pet_id = p.id
        WHERE {where_sql}
        ORDER BY qr.created_at DESC
        OFFSET :skip LIMIT :limit
    '''

    qr_result = db.execute(text(qr_sql), params).fetchall()

    # Build response with user email information
    result = []
    for qr in qr_result:
        user_email = None
        if qr[7]:  # activated_by_user_id
            # Get tenant_user email from tenant schema
            user_sql = f'SELECT email FROM "{schema_name}".tenant_users WHERE id = :user_id'
            tenant_user = db.execute(text(user_sql), {"user_id": qr[7]}).fetchone()
            if tenant_user:
                user_email = tenant_user[0]

        result.append({
            "id": qr[0],
            "code": qr[1],
            "pin": qr[2],
            "status": qr[3],
            "pet_id": qr[4],
            "pet_name": qr[9],
            "batch_id": qr[5],
            "activated_at": qr[6].isoformat() if qr[6] else None,
            "activated_by_user_id": qr[7],
            "user_id": qr[7],
            "user_email": user_email,
            "activation_count": qr[10] if qr[10] is not None else 0,
            "created_at": qr[8].isoformat() if qr[8] else None,
        })

    return result


@router.get("/scan-events", response_model=List[dict])
async def list_tenant_scan_events(
    current_user: User = Depends(get_current_tenant_admin),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get all scan events for the tenant.

    This endpoint is accessible to TENANT_ADMIN and SUPER_ADMIN roles.
    Returns all QR code scan events for the tenant.

    Args:
        current_user: Current authenticated tenant admin
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records

    Returns:
        List of scan events with QR code and pet information
    """
    schema_name = get_tenant_schema(db, current_user.tenant_id)

    # Query to get scan events with QR code and pet info
    scan_sql = f'''
        SELECT
            se.id,
            se.qr_code_id,
            se.ip_address,
            se.user_agent,
            se.location_data,
            se.scanned_at,
            qr.code as qr_code,
            p.name as pet_name,
            p.owner_id
        FROM "{schema_name}".scan_events se
        JOIN "{schema_name}".qr_codes qr ON se.qr_code_id = qr.id
        LEFT JOIN "{schema_name}".pets p ON qr.pet_id = p.id
        ORDER BY se.scanned_at DESC
        OFFSET :skip LIMIT :limit
    '''

    result = db.execute(
        text(scan_sql),
        {"skip": skip, "limit": limit}
    ).fetchall()

    # Build response
    events = []
    for row in result:
        # Get owner email if available
        owner_email = None
        if row[8]:  # owner_id
            owner_sql = f'SELECT email FROM "{schema_name}".tenant_users WHERE id = :owner_id'
            owner = db.execute(text(owner_sql), {"owner_id": row[8]}).fetchone()
            if owner:
                owner_email = owner[0]

        events.append({
            "id": row[0],
            "qr_code_id": row[1],
            "ip_address": row[2],
            "user_agent": row[3],
            "location_data": row[4],
            "scanned_at": row[5].isoformat() if row[5] else None,
            "qr_code": row[6],
            "pet_name": row[7],
            "owner_email": owner_email,
        })

    return events
