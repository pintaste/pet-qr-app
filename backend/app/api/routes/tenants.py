"""
Tenant management routes.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def get_tenants():
    """Get all tenants (super admin only)."""
    return {"message": "Get tenants endpoint - to be implemented"}


@router.post("/")
async def create_tenant():
    """Create new tenant (super admin only)."""
    return {"message": "Create tenant endpoint - to be implemented"}


@router.get("/{tenant_id}")
async def get_tenant(tenant_id: int):
    """Get tenant by ID."""
    return {"message": f"Get tenant {tenant_id} endpoint - to be implemented"}


@router.put("/{tenant_id}")
async def update_tenant(tenant_id: int):
    """Update tenant."""
    return {"message": f"Update tenant {tenant_id} endpoint - to be implemented"}


@router.delete("/{tenant_id}")
async def delete_tenant(tenant_id: int):
    """Delete tenant (super admin only)."""
    return {"message": f"Delete tenant {tenant_id} endpoint - to be implemented"}