"""API routes package."""

from fastapi import APIRouter

from app.api.routes import (
    auth,
    tenants,
    pets,
    qr_codes,
    users,
    super_admin,
    tenant_admin,
    user_dashboard,
    impersonation,
)

# Create main router
router = APIRouter()

# Include route modules
router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
router.include_router(tenants.router, prefix="/tenants", tags=["Tenants"])
router.include_router(users.router, prefix="/users", tags=["Users"])
router.include_router(pets.router, prefix="/pets", tags=["Pets"])
router.include_router(qr_codes.router, prefix="/qr-codes", tags=["QR Codes"])

# Role-based route groups
router.include_router(
    super_admin.router, prefix="/super-admin", tags=["Super Admin"]
)
router.include_router(
    tenant_admin.router, prefix="/admin", tags=["Tenant Admin"]
)
router.include_router(
    user_dashboard.router, prefix="/user", tags=["User Dashboard"]
)
router.include_router(
    impersonation.router, prefix="/impersonate", tags=["Impersonation"]
)
