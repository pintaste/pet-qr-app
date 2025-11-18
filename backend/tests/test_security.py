"""
Unit tests for security utilities (password hashing, JWT tokens).
"""

import pytest
from datetime import timedelta
from jose import jwt

from app.core import security
from app.core.config import settings


class TestPasswordHashing:
    """Tests for password hashing functions."""

    def test_hash_password_creates_valid_hash(self):
        """Test that password hashing creates a valid bcrypt hash."""
        password = "SecurePassword123!"
        hashed = security.get_password_hash(password)

        # Reason: Bcrypt hashes start with $2b$ and are 60 characters long
        assert hashed.startswith("$2b$")
        assert len(hashed) == 60

    def test_verify_password_with_correct_password(self):
        """Test password verification with correct password."""
        password = "SecurePassword123!"
        hashed = security.get_password_hash(password)

        # Reason: Correct password should verify successfully
        assert security.verify_password(password, hashed) is True

    def test_verify_password_with_incorrect_password(self):
        """Test password verification with incorrect password."""
        password = "SecurePassword123!"
        wrong_password = "WrongPassword456!"
        hashed = security.get_password_hash(password)

        # Reason: Incorrect password should fail verification
        assert security.verify_password(wrong_password, hashed) is False

    def test_hash_password_generates_unique_hashes(self):
        """Test that same password generates different hashes (salt)."""
        password = "SecurePassword123!"
        hash1 = security.get_password_hash(password)
        hash2 = security.get_password_hash(password)

        # Reason: Salting should make each hash unique
        assert hash1 != hash2
        # Reason: But both should still verify the same password
        assert security.verify_password(password, hash1) is True
        assert security.verify_password(password, hash2) is True


class TestJWTTokens:
    """Tests for JWT token creation and verification."""

    def test_create_access_token_with_string_subject(self):
        """Test creating access token with string subject."""
        subject = "user@example.com"
        token = security.create_access_token(subject)

        # Reason: Token should be a non-empty string
        assert isinstance(token, str)
        assert len(token) > 0

        # Reason: Should be able to decode token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert payload["sub"] == subject
        assert payload["type"] == "access"

    def test_create_refresh_token_with_expiry(self):
        """Test creating refresh token with custom expiry."""
        subject = "user@example.com"
        expires_delta = timedelta(days=7)
        token = security.create_refresh_token(subject, expires_delta)

        # Reason: Token should be created successfully
        assert isinstance(token, str)
        assert len(token) > 0

        # Reason: Token payload should have correct type
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert payload["sub"] == subject
        assert payload["type"] == "refresh"

    def test_verify_token_with_valid_access_token(self):
        """Test token verification with valid access token."""
        subject = "user@example.com"
        token = security.create_access_token(subject)

        # Reason: Valid token should verify successfully
        payload = security.verify_token(token, "access")
        assert payload["sub"] == subject
        assert payload["type"] == "access"

    def test_verify_token_with_wrong_type(self):
        """Test token verification fails with wrong token type."""
        subject = "user@example.com"
        token = security.create_access_token(subject)

        # Reason: Access token should not verify as refresh token
        with pytest.raises(Exception):
            security.verify_token(token, "refresh")

    def test_verify_token_with_invalid_token(self):
        """Test token verification fails with invalid token."""
        invalid_token = "invalid.jwt.token"

        # Reason: Invalid token should raise exception
        with pytest.raises(Exception):
            security.verify_token(invalid_token, "access")


@pytest.mark.parametrize(
    "password,expected_valid",
    [
        ("GoodPassword123!", True),
        ("short", True),  # No validation in current implementation
        ("", True),  # No validation in current implementation
        ("a" * 1000, True),  # Long password should still hash
    ],
)
def test_password_hashing_edge_cases(password, expected_valid):
    """
    Test password hashing with various edge cases.

    Args:
        password: Password to test.
        expected_valid: Whether hashing should succeed.
    """
    if expected_valid:
        hashed = security.get_password_hash(password)
        assert security.verify_password(password, hashed) is True
    else:
        with pytest.raises(Exception):
            security.get_password_hash(password)
