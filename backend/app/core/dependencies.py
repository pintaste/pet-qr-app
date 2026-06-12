"""
FastAPI dependencies for authentication and authorization.
"""

from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select

from ..database import get_db
from ..models.shared import User
from .security import verify_token


# Security scheme for Bearer token
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Get the current authenticated user.

    Args:
        credentials: Bearer token credentials
        db: Database session

    Returns:
        User: Current authenticated user

    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Verify the token
    user_id = verify_token(credentials.credentials, token_type="access")
    if user_id is None:
        raise credentials_exception

    # Get user from database
    statement = select(User).where(User.id == int(user_id))
    user = db.exec(statement).first()

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get the current active user.

    Args:
        current_user: Current user from get_current_user

    Returns:
        User: Current active user

    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )
    return current_user


async def get_current_super_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get the current super user (admin).

    Args:
        current_user: Current user from get_current_user

    Returns:
        User: Current super user

    Raises:
        HTTPException: If user is not a super user
    """
    from ..models.shared import UserRole

    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )
    return current_user


def get_tenant_schema(request: Request) -> str:
    """
    Get the tenant schema from request state.

    This is set by the TenantMiddleware based on the request domain/subdomain.

    Args:
        request: FastAPI request object

    Returns:
        str: Tenant schema name (e.g., "demo", "tenant_123")
    """
    return getattr(request.state, "tenant_schema", "shared")


def get_tenant_from_request(request: Request) -> Optional[str]:
    """
    Extract tenant information from request.

    This function will be enhanced to support subdomain/domain-based
    tenant identification in the multi-tenant system.

    Args:
        request: FastAPI request object

    Returns:
        str: Tenant identifier or None for default tenant
    """
    # Get tenant ID from request state (set by TenantMiddleware)
    return getattr(request.state, "tenant_id", None)


async def get_current_tenant(
    request: Request, current_user: User = Depends(get_current_user)
) -> Optional[int]:
    """
    Get the current tenant for the authenticated user.

    Args:
        request: FastAPI request object
        current_user: Current authenticated user

    Returns:
        int: Tenant ID
    """
    # Extract tenant from request (domain/subdomain)
    tenant_id = get_tenant_from_request(request)

    # Validate user has access to this tenant
    if tenant_id and current_user.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this tenant"
        )

    return tenant_id or current_user.tenant_id
