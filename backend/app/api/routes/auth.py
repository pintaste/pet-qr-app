"""
Authentication routes with JWT token management.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from app.database import get_db
from app.services.auth import AuthService
from app.models.shared import User
from app.core.security import verify_token as _verify_token

# Note: Using Pydantic models directly until shared package is properly configured
from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user_id: int
    email: str
    role: str
    tenant_id: Optional[int] = None


class RegisterRequest(BaseModel):
    email: str
    password: str


class RegisterResponse(BaseModel):
    message: str
    user_id: int
    email: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class RefreshTokenResponse(BaseModel):
    access_token: str
    token_type: str


router = APIRouter()
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Get current authenticated user from JWT token.

    Args:
        credentials: HTTP authorization credentials.
        db: Database session.

    Returns:
        User: Current authenticated user.

    Raises:
        HTTPException: If authentication fails.
    """
    from app.core.dependencies import get_current_user as get_user_dep

    # Use the dependency function we created
    return await get_user_dep(credentials, db)


@router.post("/register", response_model=RegisterResponse)
async def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
    tenant_id: Optional[int] = None,
):
    """
    User registration endpoint.

    Args:
        request: Registration request data.
        db: Database session.
        tenant_id: Optional tenant ID for tenant users.

    Returns:
        RegisterResponse: Registration response with user info.

    Raises:
        HTTPException: If registration fails.
    """
    from app.schemas.auth import UserRegister

    auth_service = AuthService(db)
    user_data = UserRegister(email=request.email, password=request.password)

    user = auth_service.create_user(user_data)

    return RegisterResponse(
        message="User registered successfully", user_id=user.id, email=user.email
    )


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
    tenant_id: Optional[int] = None,
):
    """
    User login endpoint.

    Args:
        request: Login request data.
        db: Database session.
        tenant_id: Optional tenant ID for tenant users.

    Returns:
        LoginResponse: Login response with JWT tokens.

    Raises:
        HTTPException: If authentication fails.
    """
    from app.schemas.auth import UserLogin

    auth_service = AuthService(db)
    login_data = UserLogin(email=request.email, password=request.password)

    # login_user internally calls authenticate_user (bcrypt once); don't call again
    token_response = auth_service.login_user(login_data)

    # Retrieve user via token subject — no extra bcrypt round
    user_id = _verify_token(token_response.access_token, token_type="access")
    user = db.exec(select(User).where(User.id == int(user_id))).first()

    return LoginResponse(
        access_token=token_response.access_token,
        refresh_token=token_response.refresh_token,
        token_type=token_response.token_type,
        user_id=user.id,
        email=user.email,
        role=user.role.value if hasattr(user.role, 'value') else user.role,
        tenant_id=user.tenant_id,
    )


@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Refresh JWT token endpoint.

    Args:
        request: Refresh token request.
        db: Database session.

    Returns:
        RefreshTokenResponse: New access token.

    Raises:
        HTTPException: If refresh token is invalid.
    """
    try:
        auth_service = AuthService(db)
        token_response = auth_service.refresh_access_token(request.refresh_token)
        return RefreshTokenResponse(
            access_token=token_response.access_token, token_type="bearer"
        )
    except HTTPException:
        raise
    except (ValueError, KeyError) as e:
        # Token parsing or validation errors
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )
    except (AttributeError, TypeError) as e:
        # Unexpected token format errors
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed refresh token"
        )


@router.post("/logout")
async def logout():
    """
    User logout endpoint.

    Note: With JWT tokens, logout is typically handled client-side
    by removing the tokens from storage. For enhanced security,
    a token blacklist could be implemented.

    Returns:
        dict: Logout confirmation.
    """
    return {"message": "Logout successful"}


@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current user information.

    Args:
        current_user: Current authenticated user.

    Returns:
        dict: Current user information.
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role.value
        if hasattr(current_user.role, "value")
        else current_user.role,
        "tenant_id": current_user.tenant_id,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
    }


@router.post("/verify-token")
async def verify_token_endpoint(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """
    Verify JWT token endpoint.

    Args:
        credentials: HTTP authorization credentials.
        db: Database session.

    Returns:
        dict: Token verification result.
    """
    try:
        user_id = _verify_token(credentials.credentials, token_type="access")
        if user_id is None:
            return {"valid": False}

        user = db.exec(select(User).where(User.id == int(user_id))).first()
        if user is None or not user.is_active:
            return {"valid": False}

        return {
            "valid": True,
            "user_id": user.id,
            "email": user.email,
            "role": user.role.value if hasattr(user.role, "value") else user.role,
            "tenant_id": user.tenant_id,
        }
    except (ValueError, TypeError):
        return {"valid": False}
