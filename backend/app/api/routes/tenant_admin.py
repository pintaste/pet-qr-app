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


# Default settings structure for tenants
DEFAULT_TENANT_SETTINGS = {
    "business": {
        "name": "",
        "description": "",
        "email": "",
        "phone": "",
        "address": "",
        "business_hours": "",
    },
    "branding": {
        "logo_url": "",
        "primary_color": "#6366F1",
        "secondary_color": "#10B981",
        "favicon_url": "",
    },
    "qr_defaults": {
        "style": "scanner",
        "pin_length": 4,
        "auto_generate_pin": True,
    },
    "user_settings": {
        "allow_self_registration": True,
        "default_user_role": "user",
        "session_timeout_minutes": 60,
    },
    "notifications": {
        "email_enabled": True,
        "scan_alerts": False,
        "new_user_alerts": True,
        "lost_pet_alerts": True,
    },
    "privacy": {
        "default_pet_public": True,
        "data_retention_days": 365,
    },
}


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


@router.get("/overview")
async def get_tenant_overview(
    current_user: User = Depends(get_current_tenant_admin),
    db: Session = Depends(get_db),
):
    """
    Get overview dashboard data for the tenant admin.

    Args:
        current_user: Current tenant admin user
        db: Database session

    Returns:
        Overview data including metrics, recent activity, and alerts
    """
    tenant_id = current_user.tenant_id
    schema_name = get_tenant_schema(db, tenant_id)

    # Key Metrics
    total_users = db.execute(
        text("SELECT COUNT(*) FROM shared.users WHERE tenant_id = :tenant_id"),
        {"tenant_id": tenant_id}
    ).scalar() or 0

    active_users = db.execute(
        text("SELECT COUNT(*) FROM shared.users WHERE tenant_id = :tenant_id AND is_active = true"),
        {"tenant_id": tenant_id}
    ).scalar() or 0

    total_pets = db.execute(
        text(f'SELECT COUNT(*) FROM "{schema_name}".pets')
    ).scalar() or 0

    total_qr = db.execute(
        text(f'SELECT COUNT(*) FROM "{schema_name}".qr_codes')
    ).scalar() or 0

    active_qr = db.execute(
        text(f"SELECT COUNT(*) FROM \"{schema_name}\".qr_codes WHERE status = 'ACTIVE'")
    ).scalar() or 0

    inactive_qr = db.execute(
        text(f"SELECT COUNT(*) FROM \"{schema_name}\".qr_codes WHERE status = 'INACTIVE'")
    ).scalar() or 0

    pending_qr = db.execute(
        text(f"SELECT COUNT(*) FROM \"{schema_name}\".qr_codes WHERE status = 'PENDING'")
    ).scalar() or 0

    total_scans = db.execute(
        text(f'SELECT COUNT(*) FROM "{schema_name}".scan_events')
    ).scalar() or 0

    # Quick Stats (7 days)
    new_users_7d = db.execute(
        text("""
            SELECT COUNT(*) FROM shared.users
            WHERE tenant_id = :tenant_id
            AND created_at >= NOW() - INTERVAL '7 days'
        """),
        {"tenant_id": tenant_id}
    ).scalar() or 0

    scans_7d = db.execute(
        text(f"""
            SELECT COUNT(*) FROM "{schema_name}".scan_events
            WHERE scanned_at >= NOW() - INTERVAL '7 days'
        """)
    ).scalar() or 0

    lost_pets = db.execute(
        text(f'SELECT COUNT(*) FROM "{schema_name}".pets WHERE is_pinned = true')
    ).scalar() or 0

    # Recent Activity (last 10 events)
    recent_scans = db.execute(
        text(f"""
            SELECT se.id, se.scanned_at, qr.code, p.name as pet_name, se.location_data
            FROM "{schema_name}".scan_events se
            JOIN "{schema_name}".qr_codes qr ON se.qr_code_id = qr.id
            LEFT JOIN "{schema_name}".pets p ON qr.pet_id = p.id
            ORDER BY se.scanned_at DESC
            LIMIT 5
        """)
    ).fetchall()

    recent_users = db.execute(
        text("""
            SELECT id, email, created_at
            FROM shared.users
            WHERE tenant_id = :tenant_id
            ORDER BY created_at DESC
            LIMIT 5
        """),
        {"tenant_id": tenant_id}
    ).fetchall()

    recent_activations = db.execute(
        text(f"""
            SELECT qr.id, qr.code, qr.activated_at, p.name as pet_name
            FROM "{schema_name}".qr_codes qr
            LEFT JOIN "{schema_name}".pets p ON qr.pet_id = p.id
            WHERE qr.activated_at IS NOT NULL
            ORDER BY qr.activated_at DESC
            LIMIT 5
        """)
    ).fetchall()

    # Scan trend (last 7 days)
    scan_trend = db.execute(
        text(f"""
            SELECT DATE(scanned_at) as scan_date, COUNT(*) as count
            FROM "{schema_name}".scan_events
            WHERE scanned_at >= NOW() - INTERVAL '7 days'
            GROUP BY DATE(scanned_at)
            ORDER BY scan_date
        """)
    ).fetchall()

    # Build activity feed
    activity_feed = []

    for scan in recent_scans:
        activity_feed.append({
            "type": "scan",
            "timestamp": scan[1].isoformat() if scan[1] else None,
            "description": f"QR code {scan[2]} was scanned" + (f" ({scan[3]})" if scan[3] else ""),
            "data": {"qr_code": scan[2], "pet_name": scan[3]}
        })

    for user in recent_users:
        activity_feed.append({
            "type": "registration",
            "timestamp": user[2].isoformat() if user[2] else None,
            "description": f"New user registered: {user[1]}",
            "data": {"email": user[1]}
        })

    for activation in recent_activations:
        if activation[2]:  # activated_at
            activity_feed.append({
                "type": "activation",
                "timestamp": activation[2].isoformat(),
                "description": f"QR code {activation[1]} activated" + (f" for {activation[3]}" if activation[3] else ""),
                "data": {"qr_code": activation[1], "pet_name": activation[3]}
            })

    # Sort by timestamp descending
    activity_feed.sort(key=lambda x: x["timestamp"] or "", reverse=True)
    activity_feed = activity_feed[:10]

    # Alerts
    alerts = []
    if lost_pets > 0:
        alerts.append({
            "type": "warning",
            "title": "Lost Pets",
            "message": f"{lost_pets} pet(s) currently marked as lost",
            "action": "View lost pets"
        })

    available_qr = inactive_qr
    if available_qr < 10:
        alerts.append({
            "type": "info",
            "title": "Low QR Inventory",
            "message": f"Only {available_qr} QR codes available for activation",
            "action": "Create more QR codes"
        })

    return {
        "key_metrics": {
            "total_users": total_users,
            "active_qr_codes": active_qr,
            "total_pets": total_pets,
            "total_scans": total_scans,
        },
        "quick_stats": {
            "available_qr_codes": available_qr,
            "lost_pets": lost_pets,
            "new_users_7d": new_users_7d,
            "scans_7d": scans_7d,
        },
        "qr_distribution": {
            "active": active_qr,
            "inactive": inactive_qr,
            "pending": pending_qr,
        },
        "scan_trend": [
            {"date": row[0].isoformat(), "count": row[1]}
            for row in scan_trend
        ],
        "activity_feed": activity_feed,
        "alerts": alerts,
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


@router.get("/analytics/comprehensive")
async def get_comprehensive_analytics(
    current_user: User = Depends(get_current_tenant_admin),
    db: Session = Depends(get_db),
    days: int = 30,
):
    """
    Get comprehensive analytics for the tenant admin dashboard.

    Args:
        current_user: Current tenant admin user
        db: Database session
        days: Number of days for time-based analytics (default 30)

    Returns:
        Comprehensive analytics data including trends and breakdowns
    """
    tenant_id = current_user.tenant_id
    schema_name = get_tenant_schema(db, tenant_id)

    # Overview Summary
    overview = _get_overview_summary(db, tenant_id, schema_name)

    # QR Code Activity
    qr_activity = _get_qr_activity(db, schema_name, days)

    # User Engagement
    user_engagement = _get_user_engagement(db, tenant_id, schema_name, days)

    # Pet Statistics
    pet_stats = _get_pet_statistics(db, schema_name)

    # QR Code Inventory
    qr_inventory = _get_qr_inventory(db, schema_name)

    # Support Metrics
    support_metrics = _get_support_metrics(db, schema_name)

    return {
        "overview": overview,
        "qr_activity": qr_activity,
        "user_engagement": user_engagement,
        "pet_statistics": pet_stats,
        "qr_inventory": qr_inventory,
        "support_metrics": support_metrics,
    }


def _get_overview_summary(db: Session, tenant_id: int, schema_name: str) -> dict:
    """Get overview summary statistics."""
    # Users
    total_users = db.execute(
        text("SELECT COUNT(*) FROM shared.users WHERE tenant_id = :tenant_id"),
        {"tenant_id": tenant_id}
    ).scalar() or 0

    active_users = db.execute(
        text("SELECT COUNT(*) FROM shared.users WHERE tenant_id = :tenant_id AND is_active = true"),
        {"tenant_id": tenant_id}
    ).scalar() or 0

    # QR Codes
    total_qr = db.execute(
        text(f'SELECT COUNT(*) FROM "{schema_name}".qr_codes')
    ).scalar() or 0

    active_qr = db.execute(
        text(f"SELECT COUNT(*) FROM \"{schema_name}\".qr_codes WHERE status = 'ACTIVE'")
    ).scalar() or 0

    inactive_qr = db.execute(
        text(f"SELECT COUNT(*) FROM \"{schema_name}\".qr_codes WHERE status = 'INACTIVE'")
    ).scalar() or 0

    # Pets
    total_pets = db.execute(
        text(f'SELECT COUNT(*) FROM "{schema_name}".pets')
    ).scalar() or 0

    # Scans
    total_scans = db.execute(
        text(f'SELECT COUNT(*) FROM "{schema_name}".scan_events')
    ).scalar() or 0

    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": total_users - active_users,
        "total_qr_codes": total_qr,
        "active_qr_codes": active_qr,
        "inactive_qr_codes": inactive_qr,
        "total_pets": total_pets,
        "total_scans": total_scans,
    }


def _get_qr_activity(db: Session, schema_name: str, days: int) -> dict:
    """Get QR code activity analytics."""
    # Scans over time (daily for last N days)
    scans_over_time = db.execute(
        text(f"""
            SELECT DATE(scanned_at) as scan_date, COUNT(*) as scan_count
            FROM "{schema_name}".scan_events
            WHERE scanned_at >= NOW() - INTERVAL '{days} days'
            GROUP BY DATE(scanned_at)
            ORDER BY scan_date
        """)
    ).fetchall()

    # Top scanned QR codes
    top_scanned = db.execute(
        text(f"""
            SELECT qr.code, qr.id, p.name as pet_name, COUNT(se.id) as scan_count
            FROM "{schema_name}".qr_codes qr
            LEFT JOIN "{schema_name}".scan_events se ON qr.id = se.qr_code_id
            LEFT JOIN "{schema_name}".pets p ON qr.pet_id = p.id
            GROUP BY qr.id, qr.code, p.name
            ORDER BY scan_count DESC
            LIMIT 10
        """)
    ).fetchall()

    # Scan locations (if location data available)
    scan_locations = db.execute(
        text(f"""
            SELECT location_data
            FROM "{schema_name}".scan_events
            WHERE location_data IS NOT NULL
            AND location_data::text != '{{}}'
            ORDER BY scanned_at DESC
            LIMIT 100
        """)
    ).fetchall()

    # QR Code activation rate
    total_qr = db.execute(
        text(f'SELECT COUNT(*) FROM "{schema_name}".qr_codes')
    ).scalar() or 1

    activated_qr = db.execute(
        text(f"SELECT COUNT(*) FROM \"{schema_name}\".qr_codes WHERE status = 'ACTIVE'")
    ).scalar() or 0

    activation_rate = round((activated_qr / total_qr) * 100, 1) if total_qr > 0 else 0

    return {
        "scans_over_time": [
            {"date": row[0].isoformat(), "count": row[1]}
            for row in scans_over_time
        ],
        "top_scanned_qr_codes": [
            {
                "code": row[0],
                "id": row[1],
                "pet_name": row[2],
                "scan_count": row[3]
            }
            for row in top_scanned
        ],
        "scan_locations": [
            row[0] for row in scan_locations if row[0]
        ],
        "activation_rate": activation_rate,
    }


def _get_user_engagement(db: Session, tenant_id: int, schema_name: str, days: int) -> dict:
    """Get user engagement analytics."""
    # New registrations over time
    registrations_over_time = db.execute(
        text("""
            SELECT DATE(created_at) as reg_date, COUNT(*) as reg_count
            FROM shared.users
            WHERE tenant_id = :tenant_id
            AND created_at >= NOW() - INTERVAL :days
            GROUP BY DATE(created_at)
            ORDER BY reg_date
        """),
        {"tenant_id": tenant_id, "days": f"{days} days"}
    ).fetchall()

    # Total and active users
    total_users = db.execute(
        text("SELECT COUNT(*) FROM shared.users WHERE tenant_id = :tenant_id"),
        {"tenant_id": tenant_id}
    ).scalar() or 0

    active_users = db.execute(
        text("SELECT COUNT(*) FROM shared.users WHERE tenant_id = :tenant_id AND is_active = true"),
        {"tenant_id": tenant_id}
    ).scalar() or 0

    # Pet to user ratio
    total_pets = db.execute(
        text(f'SELECT COUNT(*) FROM "{schema_name}".pets')
    ).scalar() or 0

    pet_to_user_ratio = round(total_pets / total_users, 2) if total_users > 0 else 0

    # Users with pets
    users_with_pets = db.execute(
        text(f'SELECT COUNT(DISTINCT owner_id) FROM "{schema_name}".pets')
    ).scalar() or 0

    return {
        "registrations_over_time": [
            {"date": row[0].isoformat(), "count": row[1]}
            for row in registrations_over_time
        ],
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": total_users - active_users,
        "pet_to_user_ratio": pet_to_user_ratio,
        "users_with_pets": users_with_pets,
        "users_without_pets": total_users - users_with_pets,
    }


def _get_pet_statistics(db: Session, schema_name: str) -> dict:
    """Get pet statistics analytics."""
    # Pets by species
    pets_by_species = db.execute(
        text(f"""
            SELECT species, COUNT(*) as count
            FROM "{schema_name}".pets
            GROUP BY species
            ORDER BY count DESC
        """)
    ).fetchall()

    # Top breeds
    top_breeds = db.execute(
        text(f"""
            SELECT breed, COUNT(*) as count
            FROM "{schema_name}".pets
            WHERE breed IS NOT NULL AND breed != ''
            GROUP BY breed
            ORDER BY count DESC
            LIMIT 10
        """)
    ).fetchall()

    # Pets with QR codes linked
    total_pets = db.execute(
        text(f'SELECT COUNT(*) FROM "{schema_name}".pets')
    ).scalar() or 0

    pets_with_qr = db.execute(
        text(f"""
            SELECT COUNT(*) FROM "{schema_name}".pets
            WHERE qr_code_id IS NOT NULL AND qr_code_id != ''
        """)
    ).scalar() or 0

    # Lost pets count
    lost_pets = db.execute(
        text(f'SELECT COUNT(*) FROM "{schema_name}".pets WHERE is_pinned = true')
    ).scalar() or 0

    return {
        "pets_by_species": [
            {"species": row[0] or "Unknown", "count": row[1]}
            for row in pets_by_species
        ],
        "top_breeds": [
            {"breed": row[0], "count": row[1]}
            for row in top_breeds
        ],
        "total_pets": total_pets,
        "pets_with_qr": pets_with_qr,
        "pets_without_qr": total_pets - pets_with_qr,
        "lost_pets": lost_pets,
    }


def _get_qr_inventory(db: Session, schema_name: str) -> dict:
    """Get QR code inventory analytics."""
    # QR codes by status
    qr_by_status = db.execute(
        text(f"""
            SELECT status, COUNT(*) as count
            FROM "{schema_name}".qr_codes
            GROUP BY status
            ORDER BY count DESC
        """)
    ).fetchall()

    # QR codes by batch
    qr_by_batch = db.execute(
        text(f"""
            SELECT COALESCE(batch_id, 'No Batch') as batch, COUNT(*) as count
            FROM "{schema_name}".qr_codes
            GROUP BY batch_id
            ORDER BY count DESC
            LIMIT 10
        """)
    ).fetchall()

    # Available (unassigned) QR codes
    available_qr = db.execute(
        text(f"""
            SELECT COUNT(*) FROM "{schema_name}".qr_codes
            WHERE status = 'INACTIVE' AND pet_id IS NULL
        """)
    ).scalar() or 0

    # Recently created QR codes (last 7 days)
    recent_qr = db.execute(
        text(f"""
            SELECT COUNT(*) FROM "{schema_name}".qr_codes
            WHERE created_at >= NOW() - INTERVAL '7 days'
        """)
    ).scalar() or 0

    return {
        "qr_by_status": [
            {"status": row[0], "count": row[1]}
            for row in qr_by_status
        ],
        "qr_by_batch": [
            {"batch": row[0], "count": row[1]}
            for row in qr_by_batch
        ],
        "available_qr_codes": available_qr,
        "recent_qr_codes": recent_qr,
    }


def _get_support_metrics(db: Session, schema_name: str) -> dict:
    """Get support ticket metrics."""
    # Check if support_tickets table exists
    try:
        # Tickets by status
        tickets_by_status = db.execute(
            text(f"""
                SELECT status, COUNT(*) as count
                FROM "{schema_name}".support_tickets
                GROUP BY status
            """)
        ).fetchall()

        # Tickets by priority
        tickets_by_priority = db.execute(
            text(f"""
                SELECT priority, COUNT(*) as count
                FROM "{schema_name}".support_tickets
                GROUP BY priority
            """)
        ).fetchall()

        # Open tickets count
        open_tickets = db.execute(
            text(f"""
                SELECT COUNT(*) FROM "{schema_name}".support_tickets
                WHERE status = 'open'
            """)
        ).scalar() or 0

        # Recent tickets (last 7 days)
        recent_tickets = db.execute(
            text(f"""
                SELECT COUNT(*) FROM "{schema_name}".support_tickets
                WHERE created_at >= NOW() - INTERVAL '7 days'
            """)
        ).scalar() or 0

        return {
            "tickets_by_status": [
                {"status": row[0], "count": row[1]}
                for row in tickets_by_status
            ],
            "tickets_by_priority": [
                {"priority": row[0], "count": row[1]}
                for row in tickets_by_priority
            ],
            "open_tickets": open_tickets,
            "recent_tickets": recent_tickets,
        }
    except Exception:
        # Table might not exist
        return {
            "tickets_by_status": [],
            "tickets_by_priority": [],
            "open_tickets": 0,
            "recent_tickets": 0,
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


class TenantSettingsUpdate(BaseModel):
    """Request model for updating tenant settings."""
    business: Optional[dict] = None
    branding: Optional[dict] = None
    qr_defaults: Optional[dict] = None
    user_settings: Optional[dict] = None
    notifications: Optional[dict] = None
    privacy: Optional[dict] = None


@router.get("/settings")
async def get_tenant_settings(
    current_user: User = Depends(get_current_tenant_admin),
    db: Session = Depends(get_db),
):
    """
    Get settings for the current tenant.

    Args:
        current_user: Current tenant admin user
        db: Database session

    Returns:
        Tenant settings
    """
    tenant = db.exec(
        select(Tenant).where(Tenant.id == current_user.tenant_id)
    ).first()

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )

    # Merge default settings with tenant's saved settings
    settings = {**DEFAULT_TENANT_SETTINGS}
    if tenant.settings:
        for key, value in tenant.settings.items():
            if key in settings and isinstance(value, dict):
                settings[key] = {**settings[key], **value}
            else:
                settings[key] = value

    return {
        "tenant_id": tenant.id,
        "tenant_name": tenant.name,
        "settings": settings,
    }


@router.put("/settings")
async def update_tenant_settings(
    settings_data: TenantSettingsUpdate,
    current_user: User = Depends(get_current_tenant_admin),
    db: Session = Depends(get_db),
):
    """
    Update settings for the current tenant.

    Args:
        settings_data: Settings to update
        current_user: Current tenant admin user
        db: Database session

    Returns:
        Updated tenant settings
    """
    tenant = db.exec(
        select(Tenant).where(Tenant.id == current_user.tenant_id)
    ).first()

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )

    # Get current settings or start with defaults
    current_settings = tenant.settings if tenant.settings else {**DEFAULT_TENANT_SETTINGS}

    # Update each section if provided
    update_data = settings_data.model_dump(exclude_none=True)
    for key, value in update_data.items():
        if key in current_settings and isinstance(value, dict):
            # Merge nested dictionaries
            if isinstance(current_settings[key], dict):
                current_settings[key] = {**current_settings[key], **value}
            else:
                current_settings[key] = value
        else:
            current_settings[key] = value

    # Save updated settings
    tenant.settings = current_settings
    db.add(tenant)
    db.commit()
    db.refresh(tenant)

    return {
        "tenant_id": tenant.id,
        "tenant_name": tenant.name,
        "settings": current_settings,
        "message": "Settings updated successfully",
    }


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
