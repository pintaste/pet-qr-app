"""
Security utilities for authentication and authorization.
"""

from datetime import datetime, timedelta
from typing import Any, Optional, Union

from jose import jwt, JWTError
from passlib.context import CryptContext

from .config import settings


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.

    Args:
        subject: Token subject (usually user ID or email)
        expires_delta: Token expiration time

    Returns:
        str: Encoded JWT token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT refresh token.

    Args:
        subject: Token subject (usually user ID or email)
        expires_delta: Token expiration time

    Returns:
        str: Encoded JWT refresh token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str, token_type: str = "access") -> Optional[str]:
    """
    Verify and decode a JWT token.

    Args:
        token: JWT token to verify
        token_type: Expected token type ('access' or 'refresh')

    Returns:
        str: Token subject if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        subject: str = payload.get("sub")
        token_type_claim: str = payload.get("type")

        if subject is None or token_type_claim != token_type:
            return None

        return subject
    except JWTError:
        return None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.

    Args:
        plain_password: Plain text password
        hashed_password: Hashed password

    Returns:
        bool: True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password.

    Args:
        password: Plain text password

    Returns:
        str: Hashed password
    """
    return pwd_context.hash(password)


def generate_password_reset_token(email: str) -> str:
    """
    Generate a password reset token.

    Args:
        email: User email

    Returns:
        str: Password reset token
    """
    delta = timedelta(hours=1)  # Reset token expires in 1 hour
    expire = datetime.utcnow() + delta

    to_encode = {"exp": expire, "sub": email, "type": "password_reset"}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_password_reset_token(token: str) -> Optional[str]:
    """
    Verify a password reset token.

    Args:
        token: Password reset token

    Returns:
        str: Email if token is valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        token_type: str = payload.get("type")

        if email is None or token_type != "password_reset":
            return None

        return email
    except JWTError:
        return None
