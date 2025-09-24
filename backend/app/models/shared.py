"""
Shared schema models for tenant management.
"""

from typing import Optional, Dict, Any
from datetime import datetime
from sqlmodel import SQLModel, Field, JSON, Column
from enum import Enum


class TenantTier(str, Enum):
    """Tenant tier enumeration."""
    STANDARD = "standard"
    ENTERPRISE = "enterprise"


class UserRole(str, Enum):
    """User role enumeration."""
    SUPER_ADMIN = "super_admin"
    TENANT_ADMIN = "tenant_admin"
    USER = "user"


class Tenant(SQLModel, table=True):
    """
    Tenant model for multi-tenant architecture.

    Stores in shared.tenants table.
    """
    __tablename__ = "tenants"
    __table_args__ = {"schema": "shared"}

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=255, description="Tenant display name")
    subdomain: str = Field(max_length=100, unique=True, description="Unique subdomain")
    custom_domain: Optional[str] = Field(default=None, max_length=255, description="Custom domain")
    tier: TenantTier = Field(default=TenantTier.STANDARD, description="Tenant tier")
    settings: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON), description="Tenant settings")
    is_active: bool = Field(default=True, description="Is tenant active")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Demo Pet Store",
                "subdomain": "demo",
                "custom_domain": "demo-pets.com",
                "tier": "standard",
                "settings": {
                    "theme": {
                        "primary": "#6366F1",
                        "secondary": "#10B981"
                    },
                    "features": {
                        "analytics": True,
                        "export": False
                    }
                }
            }
        }


class User(SQLModel, table=True):
    """
    Global user model for system access.

    Stores in shared.users table.
    """
    __tablename__ = "users"
    __table_args__ = {"schema": "shared"}

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(max_length=255, unique=True, description="User email")
    password_hash: str = Field(max_length=255, description="Hashed password")
    tenant_id: Optional[int] = Field(default=None, foreign_key="shared.tenants.id", description="Associated tenant")
    role: UserRole = Field(default=UserRole.USER, description="User role")
    is_active: bool = Field(default=True, description="Is user active")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "admin@demo.com",
                "tenant_id": 1,
                "role": "tenant_admin",
                "is_active": True
            }
        }