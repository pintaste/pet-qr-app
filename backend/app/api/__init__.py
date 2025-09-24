"""API routes package."""

from fastapi import APIRouter

from app.api.routes import auth, tenants, pets, qr_codes, users

# Create main router
router = APIRouter()

# Include route modules
router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
router.include_router(tenants.router, prefix="/tenants", tags=["Tenants"])
router.include_router(users.router, prefix="/users", tags=["Users"])
router.include_router(pets.router, prefix="/pets", tags=["Pets"])
router.include_router(qr_codes.router, prefix="/qr-codes", tags=["QR Codes"])