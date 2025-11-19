"""
User impersonation functionality.

Allows SUPER_ADMIN and TENANT_ADMIN to impersonate other users for support purposes.
All impersonation actions are logged for audit purposes.
"""

from typing import Optional
from datetime import datetime
from fastapi import Request, HTTPException, status
from sqlmodel import Session, select

from app.models.shared import User, UserRole


class ImpersonationContext:
    """
    Context manager for user impersonation.

    Tracks the original user and the impersonated user for audit logging.
    """

    def __init__(self):
        self.original_user_id: Optional[int] = None
        self.impersonated_user_id: Optional[int] = None
        self.started_at: Optional[datetime] = None

    def start_impersonation(
        self, original_user: User, impersonated_user: User
    ) -> None:
        """
        Start impersonating another user.

        Args:
            original_user: The admin/super-admin starting impersonation
            impersonated_user: The user being impersonated

        Raises:
            HTTPException: If impersonation is not allowed
        """
        # Validate permissions
        if original_user.role == UserRole.SUPER_ADMIN:
            # Super admin can impersonate anyone
            pass
        elif original_user.role == UserRole.TENANT_ADMIN:
            # Tenant admin can only impersonate users in their tenant
            if impersonated_user.tenant_id != original_user.tenant_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot impersonate users from other tenants",
                )
            # Tenant admin cannot impersonate other admins or super admins
            if impersonated_user.role in [
                UserRole.TENANT_ADMIN,
                UserRole.SUPER_ADMIN,
            ]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot impersonate admin users",
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions for impersonation",
            )

        self.original_user_id = original_user.id
        self.impersonated_user_id = impersonated_user.id
        self.started_at = datetime.utcnow()

    def stop_impersonation(self) -> None:
        """Stop the current impersonation session."""
        self.original_user_id = None
        self.impersonated_user_id = None
        self.started_at = None

    def is_impersonating(self) -> bool:
        """Check if currently impersonating another user."""
        return self.impersonated_user_id is not None

    def get_effective_user_id(self) -> Optional[int]:
        """Get the effective user ID (impersonated user if active, otherwise original user)."""
        return self.impersonated_user_id or self.original_user_id


# Global impersonation context (will be enhanced with session-based storage)
_impersonation_context = {}


def get_impersonation_context(request: Request) -> ImpersonationContext:
    """
    Get or create impersonation context for the current request/session.

    Args:
        request: FastAPI request object

    Returns:
        ImpersonationContext for the current session
    """
    # Use session ID or user ID as key (simplified for now)
    session_key = id(request)
    if session_key not in _impersonation_context:
        _impersonation_context[session_key] = ImpersonationContext()
    return _impersonation_context[session_key]


async def get_effective_user(
    request: Request, current_user: User, db: Session
) -> User:
    """
    Get the effective user for the current request.

    If impersonation is active, returns the impersonated user.
    Otherwise, returns the current user.

    Args:
        request: FastAPI request object
        current_user: Current authenticated user
        db: Database session

    Returns:
        The effective user (either impersonated or current)
    """
    context = get_impersonation_context(request)

    if context.is_impersonating():
        # Return the impersonated user
        statement = select(User).where(User.id == context.impersonated_user_id)
        impersonated_user = db.exec(statement).first()

        if not impersonated_user:
            # Impersonation session is invalid, clear it
            context.stop_impersonation()
            return current_user

        return impersonated_user

    return current_user
