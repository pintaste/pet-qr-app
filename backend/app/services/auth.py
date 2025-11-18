"""
Authentication service layer.
"""

from typing import Optional

from fastapi import HTTPException, status
from sqlmodel import Session, select

from ..core.config import settings
from ..core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
    verify_token,
    generate_password_reset_token,
    verify_password_reset_token,
)
from ..models.shared import User
from ..schemas.auth import (
    UserLogin,
    UserRegister,
    TokenResponse,
    PasswordResetRequest,
    PasswordResetConfirm,
    ChangePasswordRequest,
)


class AuthService:
    """Authentication service for handling user auth operations."""

    def __init__(self, db: Session):
        """
        Initialize auth service.

        Args:
            db: Database session
        """
        self.db = db

    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """
        Authenticate a user with email and password.

        Args:
            email: User email
            password: User password

        Returns:
            User: Authenticated user or None if invalid
        """
        statement = select(User).where(User.email == email)
        user = self.db.exec(statement).first()

        if not user:
            return None

        if not verify_password(password, user.password_hash):
            return None

        return user

    def create_user(self, user_data: UserRegister) -> User:
        """
        Create a new user.

        Args:
            user_data: User registration data

        Returns:
            User: Created user

        Raises:
            HTTPException: If email already exists
        """
        # Check if user already exists
        statement = select(User).where(User.email == user_data.email)
        existing_user = self.db.exec(statement).first()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Create new user
        user = User(
            email=user_data.email,
            password_hash=get_password_hash(user_data.password),
            is_active=True,
        )

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return user

    def login_user(self, login_data: UserLogin) -> TokenResponse:
        """
        Login a user and return tokens.

        Args:
            login_data: User login data

        Returns:
            TokenResponse: Access and refresh tokens

        Raises:
            HTTPException: If authentication fails
        """
        user = self.authenticate_user(login_data.email, login_data.password)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
            )

        # Create tokens
        access_token = create_access_token(subject=user.id)
        refresh_token = create_refresh_token(subject=user.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    def refresh_access_token(self, refresh_token: str) -> TokenResponse:
        """
        Refresh access token using refresh token.

        Args:
            refresh_token: Valid refresh token

        Returns:
            TokenResponse: New access and refresh tokens

        Raises:
            HTTPException: If refresh token is invalid
        """
        user_id = verify_token(refresh_token, token_type="refresh")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
            )

        # Verify user exists and is active
        statement = select(User).where(User.id == int(user_id))
        user = self.db.exec(statement).first()

        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )

        # Create new tokens
        access_token = create_access_token(subject=user.id)
        new_refresh_token = create_refresh_token(subject=user.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    def request_password_reset(self, request_data: PasswordResetRequest) -> str:
        """
        Request a password reset token.

        Args:
            request_data: Password reset request data

        Returns:
            str: Password reset token

        Raises:
            HTTPException: If user not found
        """
        statement = select(User).where(User.email == request_data.email)
        user = self.db.exec(statement).first()

        if not user:
            # For security, don't reveal if email exists
            raise HTTPException(
                status_code=status.HTTP_200_OK,
                detail="If the email exists, a reset link will be sent",
            )

        reset_token = generate_password_reset_token(user.email)

        # TODO: Send email with reset token
        # This would integrate with AWS SES in production

        return reset_token

    def reset_password(self, reset_data: PasswordResetConfirm) -> bool:
        """
        Reset user password with token.

        Args:
            reset_data: Password reset confirmation data

        Returns:
            bool: True if password was reset successfully

        Raises:
            HTTPException: If token is invalid
        """
        email = verify_password_reset_token(reset_data.token)

        if email is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token",
            )

        statement = select(User).where(User.email == email)
        user = self.db.exec(statement).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        # Update password
        user.password_hash = get_password_hash(reset_data.new_password)
        self.db.add(user)
        self.db.commit()

        return True

    def change_password(self, user: User, change_data: ChangePasswordRequest) -> bool:
        """
        Change user password.

        Args:
            user: Current user
            change_data: Password change data

        Returns:
            bool: True if password was changed successfully

        Raises:
            HTTPException: If current password is incorrect
        """
        if not verify_password(change_data.current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect current password",
            )

        # Update password
        user.password_hash = get_password_hash(change_data.new_password)
        self.db.add(user)
        self.db.commit()

        return True
