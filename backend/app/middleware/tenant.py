"""
Tenant identification and routing middleware with database integration.
"""

from typing import Optional
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from sqlmodel import Session
from app.core.database import AsyncSessionLocal
from app.core.exceptions import TenantNotFoundError
from app.services.tenant_service import tenant_service
from app.models.shared import Tenant


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Middleware to identify and set tenant information from request.

    Identifies tenant from:
    1. Custom domain (e.g., petstore.com)
    2. Subdomain (e.g., petstore.petqr.com)
    3. Default tenant for localhost/development
    """

    async def dispatch(self, request: Request, call_next):
        """
        Process request and identify tenant.

        Args:
            request: FastAPI request object.
            call_next: Next middleware in chain.

        Returns:
            Response: HTTP response.
        """
        # Extract tenant information
        tenant_info = await self._identify_tenant(request)

        # Set tenant in request state
        request.state.tenant = tenant_info.get("tenant")
        request.state.tenant_id = tenant_info.get("tenant_id")
        request.state.tenant_schema = tenant_info.get("schema_name")
        request.state.tenant_subdomain = tenant_info.get("subdomain")

        # Process request
        response = await call_next(request)

        # Add tenant info to response headers for debugging (optional)
        if tenant_info.get("tenant"):
            response.headers["X-Tenant-ID"] = str(tenant_info["tenant_id"])
            response.headers["X-Tenant-Schema"] = tenant_info["schema_name"]

        return response

    async def _identify_tenant(self, request: Request) -> dict:
        """
        Identify tenant from request using tenant service.

        Args:
            request: FastAPI request object.

        Returns:
            dict: Tenant information.
        """
        host = request.headers.get("host", "").lower()

        # Skip tenant identification for certain paths
        if self._should_skip_tenant_check(request.url.path):
            return {
                "tenant": None,
                "tenant_id": None,
                "schema_name": "shared",
                "subdomain": None,
            }

        try:
            # Use async database session
            async with AsyncSessionLocal() as db:
                tenant = await tenant_service.get_tenant_by_domain(db, host)

                if tenant:
                    schema_name = tenant_service.get_tenant_schema_name(tenant)
                    return {
                        "tenant": tenant,
                        "tenant_id": tenant.id,
                        "schema_name": schema_name,
                        "subdomain": tenant.subdomain,
                    }

                # No tenant found - check if it's a development/localhost request
                if host.startswith("localhost") or host.startswith("127.0.0.1"):
                    # Try to get demo tenant for development
                    demo_tenant = await self._get_demo_tenant(db)
                    if demo_tenant:
                        schema_name = tenant_service.get_tenant_schema_name(demo_tenant)
                        return {
                            "tenant": demo_tenant,
                            "tenant_id": demo_tenant.id,
                            "schema_name": schema_name,
                            "subdomain": demo_tenant.subdomain,
                        }

        except Exception as e:
            # Log error but don't break the application
            print(f"Error identifying tenant: {e}")

        # Default to shared schema for unknown requests
        return {
            "tenant": None,
            "tenant_id": None,
            "schema_name": "shared",
            "subdomain": None,
        }

    async def _get_demo_tenant(self, db: Session) -> Optional[Tenant]:
        """
        Get demo tenant for development purposes.

        Args:
            db: Database session.

        Returns:
            Optional[Tenant]: Demo tenant if exists.
        """
        try:
            from sqlmodel import select

            demo_tenant = db.exec(
                select(Tenant).where(Tenant.subdomain == "demo")
            ).first()
            return demo_tenant
        except Exception:
            return None

    def _should_skip_tenant_check(self, path: str) -> bool:
        """
        Check if tenant identification should be skipped for this path.

        Args:
            path: Request path.

        Returns:
            bool: True if tenant check should be skipped.
        """
        skip_paths = [
            "/",
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/favicon.ico",
        ]

        skip_prefixes = [
            "/static/",
            "/assets/",
            "/api/auth/",  # Some auth endpoints might not need tenant context
            "/api/v1/auth/",  # Auth endpoints with v1 prefix
            "/api/admin/",  # Admin endpoints use shared schema
            "/api/v1/admin/",  # Admin endpoints with v1 prefix
        ]

        # Check exact paths
        if path in skip_paths:
            return True

        # Check path prefixes
        for prefix in skip_prefixes:
            if path.startswith(prefix):
                return True

        return False


def get_current_tenant(request: Request) -> Optional[Tenant]:
    """
    Get current tenant from request state.

    Args:
        request: FastAPI request object.

    Returns:
        Optional[Tenant]: Current tenant or None.
    """
    return getattr(request.state, "tenant", None)


def get_current_tenant_id(request: Request) -> Optional[int]:
    """
    Get current tenant ID from request state.

    Args:
        request: FastAPI request object.

    Returns:
        Optional[int]: Current tenant ID or None.
    """
    return getattr(request.state, "tenant_id", None)


def get_current_tenant_schema(request: Request) -> str:
    """
    Get current tenant schema from request state.

    Args:
        request: FastAPI request object.

    Returns:
        str: Current tenant schema name.
    """
    return getattr(request.state, "tenant_schema", "shared")


def require_tenant(request: Request) -> Tenant:
    """
    Get current tenant from request state, raising error if not found.

    Args:
        request: FastAPI request object.

    Returns:
        Tenant: Current tenant.

    Raises:
        TenantNotFoundError: If no tenant is found.
    """
    tenant = get_current_tenant(request)
    if not tenant:
        raise TenantNotFoundError("No tenant found in request context")
    return tenant
