"""
Authentication service with JWT token management and password hashing.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlmodel import Session, select
from app.core.config import settings
from app.models.shared import User, UserRole
from app.models.tenant import TenantUser


class AuthService:
    """
    Authentication service for JWT token management and password operations.
    """

    def __init__(self):
        """Initialize authentication service."""
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.secret_key = settings.SECRET_KEY
        self.algorithm = settings.ALGORITHM
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
        self.refresh_token_expire_days = settings.REFRESH_TOKEN_EXPIRE_DAYS

    def hash_password(self, password: str) -> str:
        """
        Hash a password using bcrypt.

        Args:
            password (str): Plain text password.

        Returns:
            str: Hashed password.
        """
        return self.pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Verify a password against its hash.

        Args:
            plain_password (str): Plain text password.
            hashed_password (str): Hashed password.

        Returns:
            bool: True if password matches, False otherwise.
        """
        return self.pwd_context.verify(plain_password, hashed_password)

    def create_access_token(
        self,
        data: Dict[str, Any],
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        Create a JWT access token.

        Args:
            data (Dict[str, Any]): Data to encode in the token.
            expires_delta (Optional[timedelta]): Token expiration time.

        Returns:
            str: JWT token.
        """
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)

        to_encode.update({"exp": expire, "type": "access"})
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)

    def create_refresh_token(
        self,
        data: Dict[str, Any],
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        Create a JWT refresh token.

        Args:
            data (Dict[str, Any]): Data to encode in the token.
            expires_delta (Optional[timedelta]): Token expiration time.

        Returns:
            str: JWT refresh token.
        """
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)

        to_encode.update({"exp": expire, "type": "refresh"})
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)

    def verify_token(self, token: str, token_type: str = "access") -> Dict[str, Any]:
        """
        Verify and decode a JWT token.

        Args:
            token (str): JWT token to verify.
            token_type (str): Expected token type ("access" or "refresh").

        Returns:
            Dict[str, Any]: Decoded token payload.

        Raises:
            HTTPException: If token is invalid or expired.
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])

            # Check token type
            if payload.get("type") != token_type:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type"
                )

            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )

    def authenticate_user(
        self,
        db: Session,
        email: str,
        password: str,
        tenant_id: Optional[int] = None
    ) -> Optional[User]:
        """
        Authenticate a user with email and password.

        Args:
            db (Session): Database session.
            email (str): User email.
            password (str): Plain text password.
            tenant_id (Optional[int]): Tenant ID for tenant users.

        Returns:
            Optional[User]: User object if authentication successful, None otherwise.
        """
        # Check if it's a global user (super admin, tenant admin)
        user = db.exec(select(User).where(User.email == email)).first()

        if user and self.verify_password(password, user.password_hash):
            return user

        # Check if it's a tenant user
        if tenant_id:
            tenant_user = db.exec(
                select(TenantUser)
                .where(TenantUser.email == email)
                .where(TenantUser.tenant_id == tenant_id)
            ).first()

            if tenant_user and self.verify_password(password, tenant_user.password_hash):
                # Create a User-like object for consistency
                user_obj = User(
                    id=tenant_user.id,
                    email=tenant_user.email,
                    role=UserRole.TENANT_ADMIN,  # Tenant users are treated as tenant admins
                    tenant_id=tenant_id,
                    is_active=tenant_user.is_active,
                    created_at=tenant_user.created_at,
                    updated_at=tenant_user.updated_at,
                    password_hash=tenant_user.password_hash
                )
                return user_obj

        return None

    def create_tokens_for_user(self, user: User) -> Dict[str, str]:
        """
        Create access and refresh tokens for a user.

        Args:
            user (User): User object.

        Returns:
            Dict[str, str]: Dictionary containing access_token and refresh_token.
        """
        user_data = {
            "sub": user.email,
            "user_id": user.id,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "tenant_id": user.tenant_id
        }

        access_token = self.create_access_token(data=user_data)
        refresh_token = self.create_refresh_token(data=user_data)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

    def refresh_access_token(self, refresh_token: str) -> str:
        """
        Generate a new access token from a refresh token.

        Args:
            refresh_token (str): Valid refresh token.

        Returns:
            str: New access token.

        Raises:
            HTTPException: If refresh token is invalid.
        """
        payload = self.verify_token(refresh_token, token_type="refresh")

        # Create new access token with same user data
        user_data = {
            "sub": payload["sub"],
            "user_id": payload["user_id"],
            "role": payload["role"],
            "tenant_id": payload.get("tenant_id")
        }

        return self.create_access_token(data=user_data)

    def get_current_user_from_token(
        self,
        db: Session,
        token: str
    ) -> User:
        """
        Get current user from JWT token.

        Args:
            db (Session): Database session.
            token (str): JWT access token.

        Returns:
            User: Current user object.

        Raises:
            HTTPException: If token is invalid or user not found.
        """
        payload = self.verify_token(token, token_type="access")
        email = payload.get("sub")
        user_id = payload.get("user_id")
        tenant_id = payload.get("tenant_id")

        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )

        # Try to get global user first
        user = db.exec(select(User).where(User.email == email)).first()

        if user:
            return user

        # Try to get tenant user
        if tenant_id:
            tenant_user = db.exec(
                select(TenantUser)
                .where(TenantUser.email == email)
                .where(TenantUser.tenant_id == tenant_id)
            ).first()

            if tenant_user:
                # Create User-like object
                user_obj = User(
                    id=tenant_user.id,
                    email=tenant_user.email,
                    role=UserRole.TENANT_ADMIN,
                    tenant_id=tenant_id,
                    is_active=tenant_user.is_active,
                    created_at=tenant_user.created_at,
                    updated_at=tenant_user.updated_at,
                    password_hash=tenant_user.password_hash
                )
                return user_obj

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )


# Global auth service instance
auth_service = AuthService()