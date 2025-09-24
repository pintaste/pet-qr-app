"""
Application configuration settings.
"""

from typing import List, Optional
from pydantic import Field, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """

    # Application
    APP_NAME: str = Field(default="Pet QR System", description="Application name")
    APP_VERSION: str = Field(default="1.0.0", description="Application version")
    DEBUG: bool = Field(default=False, description="Debug mode")
    ENVIRONMENT: str = Field(default="production", description="Environment")

    # Database
    DATABASE_URL: str = Field(..., description="Database connection URL")
    DATABASE_HOST: str = Field(default="localhost", description="Database host")
    DATABASE_PORT: int = Field(default=5432, description="Database port")
    DATABASE_NAME: str = Field(default="pet_qr_system", description="Database name")
    DATABASE_USER: str = Field(default="postgres", description="Database user")
    DATABASE_PASSWORD: str = Field(..., description="Database password")

    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379", description="Redis URL")
    REDIS_HOST: str = Field(default="localhost", description="Redis host")
    REDIS_PORT: int = Field(default=6379, description="Redis port")

    # JWT Configuration
    SECRET_KEY: str = Field(..., description="JWT secret key")
    ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, description="Access token expiry")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=30, description="Refresh token expiry")

    # AWS Configuration
    AWS_ACCESS_KEY_ID: Optional[str] = Field(default=None, description="AWS access key")
    AWS_SECRET_ACCESS_KEY: Optional[str] = Field(default=None, description="AWS secret key")
    AWS_REGION: str = Field(default="us-east-1", description="AWS region")

    # S3 Configuration
    S3_BUCKET_NAME: str = Field(default="pet-qr-uploads", description="S3 bucket name")
    S3_ENDPOINT_URL: Optional[str] = Field(default=None, description="S3 endpoint URL")

    # CloudFront Configuration
    CLOUDFRONT_DOMAIN: Optional[str] = Field(default=None, description="CloudFront domain")

    # SES Configuration
    SES_FROM_EMAIL: str = Field(default="noreply@petqr.com", description="SES from email")
    SES_REGION: str = Field(default="us-east-1", description="SES region")

    # CORS Configuration
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        description="CORS allowed origins (comma-separated)"
    )

    def get_cors_origins(self) -> List[str]:
        """Get CORS origins as a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # QR Code Configuration
    QR_CODE_BASE_URL: str = Field(
        default="https://petqr.com/qr",
        description="Base URL for QR codes"
    )
    DEFAULT_QR_SIZE: int = Field(default=200, description="Default QR code size")

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = Field(default=60, description="Rate limit per minute")
    SCAN_RATE_LIMIT_PER_HOUR: int = Field(default=100, description="Scan rate limit per hour")

    # Super Admin
    SUPER_ADMIN_EMAIL: str = Field(default="admin@petqr.com", description="Super admin email")
    SUPER_ADMIN_PASSWORD: str = Field(..., description="Super admin password")

    # Development Tools
    ENABLE_DOCS: bool = Field(default=True, description="Enable API documentation")
    ENABLE_REDOC: bool = Field(default=True, description="Enable ReDoc documentation")

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()