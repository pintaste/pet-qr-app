"""
Impersonation API routes.

Allows admins to impersonate users for support and troubleshooting.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session, select
from pydantic import BaseModel

from app.core.dependencies import get_current_user, get_db
from app.models.shared import User, UserRole
from app.core.impersonation import (
    get_impersonation_context,
    ImpersonationContext,
)

router = APIRouter()


class ImpersonateRequest(BaseModel):
    """Request model for starting impersonation."""

    user_id: int


class ImpersonateResponse(BaseModel):
    """Response model for impersonation status."""

    success: bool
    message: str
    impersonated_user: dict


@router.post("/start", response_model=ImpersonateResponse)
async def start_impersonation(
    request: Request,
    impersonate_req: ImpersonateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Start impersonating another user.

    Args:
        request: FastAPI request object
        impersonate_req: Impersonation request with target user ID
        current_user: Current authenticated user (admin)
        db: Database session

    Returns:
        Impersonation status and impersonated user info

    Raises:
        HTTPException: If user is not authorized or target user not found
    """
    # Check if user has impersonation permissions
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can impersonate users",
        )

    # Get the target user
    statement = select(User).where(User.id == impersonate_req.user_id)
    target_user = db.exec(statement).first()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Get impersonation context
    context = get_impersonation_context(request)

    # Start impersonation (this will validate permissions)
    context.start_impersonation(current_user, target_user)

    # TODO: Log impersonation start to audit table

    return ImpersonateResponse(
        success=True,
        message=f"Now impersonating {target_user.email}",
        impersonated_user={
            "id": target_user.id,
            "email": target_user.email,
            "role": target_user.role,
            "tenant_id": target_user.tenant_id,
        },
    )


@router.post("/stop")
async def stop_impersonation(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """
    Stop the current impersonation session.

    Args:
        request: FastAPI request object
        current_user: Current authenticated user

    Returns:
        Success status
    """
    context = get_impersonation_context(request)

    if not context.is_impersonating():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not currently impersonating anyone",
        )

    # TODO: Log impersonation end to audit table

    context.stop_impersonation()

    return {"success": True, "message": "Impersonation stopped"}


@router.get("/status")
async def get_impersonation_status(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get the current impersonation status.

    Args:
        request: FastAPI request object
        current_user: Current authenticated user
        db: Database session

    Returns:
        Impersonation status information
    """
    context = get_impersonation_context(request)

    if not context.is_impersonating():
        return {
            "is_impersonating": False,
            "original_user": {
                "id": current_user.id,
                "email": current_user.email,
                "role": current_user.role,
            },
        }

    # Get impersonated user details
    statement = select(User).where(User.id == context.impersonated_user_id)
    impersonated_user = db.exec(statement).first()

    return {
        "is_impersonating": True,
        "original_user": {
            "id": current_user.id,
            "email": current_user.email,
            "role": current_user.role,
        },
        "impersonated_user": {
            "id": impersonated_user.id,
            "email": impersonated_user.email,
            "role": impersonated_user.role,
            "tenant_id": impersonated_user.tenant_id,
        }
        if impersonated_user
        else None,
        "started_at": context.started_at,
    }
