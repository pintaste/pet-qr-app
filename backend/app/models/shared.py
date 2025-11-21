"""
Shared schema models for tenant management.
"""

from typing import Optional, Dict, Any
from datetime import datetime
from sqlmodel import SQLModel, Field, JSON, Column
from sqlalchemy import Enum as SQLAEnum
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
    custom_domain: Optional[str] = Field(
        default=None, max_length=255, description="Custom domain"
    )
    tier: TenantTier = Field(
        default=TenantTier.STANDARD,
        sa_column=Column(SQLAEnum(TenantTier, native_enum=False, values_callable=lambda obj: [e.value for e in obj])),
        description="Tenant tier"
    )
    settings: Dict[str, Any] = Field(
        default_factory=dict, sa_column=Column(JSON), description="Tenant settings"
    )
    is_active: bool = Field(default=True, description="Is tenant active")
    subscription_expires_at: Optional[datetime] = Field(
        default=None, description="Subscription expiration date"
    )
    created_by_id: Optional[int] = Field(
        default=None, foreign_key="shared.users.id", description="Super admin who created the tenant"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="Creation timestamp"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, description="Last update timestamp"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Demo Pet Store",
                "subdomain": "demo",
                "custom_domain": "demo-pets.com",
                "tier": "standard",
                "settings": {
                    "theme": {"primary": "#6366F1", "secondary": "#10B981"},
                    "features": {"analytics": True, "export": False},
                },
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
    tenant_id: Optional[int] = Field(
        default=None, foreign_key="shared.tenants.id", description="Associated tenant"
    )
    role: UserRole = Field(
        default=UserRole.USER,
        sa_column=Column(SQLAEnum(UserRole, native_enum=False, values_callable=lambda obj: [e.value for e in obj])),
        description="User role"
    )
    is_active: bool = Field(default=True, description="Is user active")
    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="Creation timestamp"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, description="Last update timestamp"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "email": "admin@demo.com",
                "tenant_id": 1,
                "role": "tenant_admin",
                "is_active": True,
            }
        }


class ImpersonationLog(SQLModel, table=True):
    """
    Impersonation log model for audit tracking.

    Stores in shared.impersonation_logs table.
    """

    __tablename__ = "impersonation_logs"
    __table_args__ = {"schema": "shared"}

    id: Optional[int] = Field(default=None, primary_key=True)
    super_admin_id: int = Field(
        foreign_key="shared.users.id", description="Admin performing impersonation"
    )
    impersonated_user_id: int = Field(
        foreign_key="shared.users.id", description="User being impersonated"
    )
    started_at: datetime = Field(
        default_factory=datetime.utcnow, description="Impersonation start time"
    )
    ended_at: Optional[datetime] = Field(
        default=None, description="Impersonation end time"
    )
    actions_taken: Optional[Dict[str, Any]] = Field(
        default=None, sa_column=Column(JSON), description="Actions performed during impersonation"
    )
    ip_address: Optional[str] = Field(
        default=None, max_length=50, description="IP address of admin"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "super_admin_id": 1,
                "impersonated_user_id": 5,
                "started_at": "2025-11-19T10:00:00",
                "ip_address": "192.168.1.100",
            }
        }


class QRBatch(SQLModel, table=True):
    """
    QR batch model for tracking batch generation and assignment.

    Stores in shared.qr_batches table.
    """

    __tablename__ = "qr_batches"
    __table_args__ = {"schema": "shared"}

    id: Optional[int] = Field(default=None, primary_key=True)
    batch_id: str = Field(
        max_length=255, unique=True, description="Unique batch identifier"
    )
    quantity: int = Field(description="Number of QR codes in this batch")
    assigned_to_tenant_id: Optional[int] = Field(
        default=None,
        foreign_key="shared.tenants.id",
        description="Tenant this batch is assigned to",
    )
    created_by_admin_id: int = Field(
        foreign_key="shared.users.id", description="Super admin who created the batch"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="Batch creation timestamp"
    )
    print_data: Optional[Dict[str, Any]] = Field(
        default=None, sa_column=Column(JSON), description="Printing metadata"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "batch_id": "BATCH-2025-001",
                "quantity": 1000,
                "assigned_to_tenant_id": 1,
                "created_by_admin_id": 1,
                "print_data": {
                    "factory": "PrintCorp",
                    "print_date": "2025-11-19",
                    "notes": "Initial batch for Demo Store",
                },
            }
        }
