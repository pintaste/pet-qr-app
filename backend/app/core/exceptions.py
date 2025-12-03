"""
Custom exception classes for the Pet QR System.
"""

from typing import Optional


class PetQRException(Exception):
    """
    Base exception class for Pet QR System.

    Args:
        detail: Error message detail.
        status_code: HTTP status code.
        error_code: Application-specific error code.
    """

    def __init__(
        self,
        detail: str,
        status_code: int = 500,
        error_code: Optional[str] = None,
    ):
        self.detail = detail
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(detail)


class AuthenticationError(PetQRException):
    """Authentication related errors."""

    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(detail=detail, status_code=401, error_code="AUTH_FAILED")


class AuthorizationError(PetQRException):
    """Authorization related errors."""

    def __init__(self, detail: str = "Not authorized"):
        super().__init__(detail=detail, status_code=403, error_code="NOT_AUTHORIZED")


class TenantNotFoundError(PetQRException):
    """Tenant not found error."""

    def __init__(self, detail: str = "Tenant not found"):
        super().__init__(detail=detail, status_code=404, error_code="TENANT_NOT_FOUND")


class QRCodeNotFoundError(PetQRException):
    """QR code not found error."""

    def __init__(self, detail: str = "QR code not found"):
        super().__init__(detail=detail, status_code=404, error_code="QR_CODE_NOT_FOUND")


class PetNotFoundError(PetQRException):
    """Pet not found error."""

    def __init__(self, detail: str = "Pet not found"):
        super().__init__(detail=detail, status_code=404, error_code="PET_NOT_FOUND")


class InvalidPINError(PetQRException):
    """Invalid PIN error."""

    def __init__(self, detail: str = "Invalid PIN code"):
        super().__init__(detail=detail, status_code=400, error_code="INVALID_PIN")


class QRCodeAlreadyActivatedError(PetQRException):
    """QR code already activated error."""

    def __init__(self, detail: str = "QR code is already activated"):
        super().__init__(
            detail=detail, status_code=400, error_code="QR_CODE_ALREADY_ACTIVATED"
        )


class RateLimitExceededError(PetQRException):
    """Rate limit exceeded error."""

    def __init__(self, detail: str = "Rate limit exceeded"):
        super().__init__(
            detail=detail, status_code=429, error_code="RATE_LIMIT_EXCEEDED"
        )


class ValidationError(PetQRException):
    """Data validation error."""

    def __init__(self, detail: str = "Validation failed"):
        super().__init__(detail=detail, status_code=422, error_code="VALIDATION_ERROR")


class DatabaseError(PetQRException):
    """Database operation error."""

    def __init__(self, detail: str = "Database operation failed"):
        super().__init__(detail=detail, status_code=500, error_code="DATABASE_ERROR")


class SchemaCreationError(PetQRException):
    """Schema creation error."""

    def __init__(self, detail: str = "Failed to create schema"):
        super().__init__(
            detail=detail, status_code=500, error_code="SCHEMA_CREATION_ERROR"
        )


class TenantCreationError(PetQRException):
    """Tenant creation error."""

    def __init__(self, detail: str = "Failed to create tenant"):
        super().__init__(
            detail=detail, status_code=500, error_code="TENANT_CREATION_ERROR"
        )


class QRCodeGenerationError(PetQRException):
    """QR code generation error."""

    def __init__(self, detail: str = "Failed to generate QR code"):
        super().__init__(
            detail=detail, status_code=500, error_code="QR_GENERATION_ERROR"
        )


class UserNotFoundError(PetQRException):
    """User not found error."""

    def __init__(self, detail: str = "User not found"):
        super().__init__(detail=detail, status_code=404, error_code="USER_NOT_FOUND")


class DuplicateEntryError(PetQRException):
    """Duplicate entry error (e.g., unique constraint violation)."""

    def __init__(self, detail: str = "Entry already exists"):
        super().__init__(detail=detail, status_code=409, error_code="DUPLICATE_ENTRY")
