"""
Tenant-specific schema models.

These models exist in tenant-specific schemas (e.g., tenant_demo).
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, date
from sqlmodel import SQLModel, Field, JSON, Column
from enum import Enum


class QRCodeStatus(str, Enum):
    """QR code status enumeration."""

    INACTIVE = "INACTIVE"
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"


class TicketStatus(str, Enum):
    """Support ticket status enumeration."""

    OPEN = "open"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"


class TicketPriority(str, Enum):
    """Support ticket priority enumeration."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TenantUser(SQLModel, table=True):
    """
    Tenant-specific user model for pet owners.

    Stores in {tenant_schema}.tenant_users table.
    """

    __tablename__ = "tenant_users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(max_length=255, unique=True, description="User email")
    password_hash: str = Field(max_length=255, description="Hashed password")
    first_name: Optional[str] = Field(
        default=None, max_length=255, description="First name"
    )
    last_name: Optional[str] = Field(
        default=None, max_length=255, description="Last name"
    )
    phone: Optional[str] = Field(
        default=None, max_length=50, description="Phone number"
    )
    address: Optional[str] = Field(default=None, description="Address")
    language: str = Field(default="en", max_length=10, description="Preferred language")
    privacy_settings: Dict[str, Any] = Field(
        default_factory=lambda: {"show_email": False, "show_phone": True},
        sa_column=Column(JSON),
        description="Privacy settings",
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
                "email": "john.smith@email.com",
                "first_name": "John",
                "last_name": "Smith",
                "phone": "+1 (555) 123-4567",
                "language": "en",
                "privacy_settings": {"show_email": True, "show_phone": True},
            }
        }


class Pet(SQLModel, table=True):
    """
    Pet model for storing pet information.

    Stores in {tenant_schema}.pets table.
    """

    __tablename__ = "pets"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=255, description="Pet name")
    breed: Optional[str] = Field(default=None, max_length=255, description="Pet breed")
    age: Optional[int] = Field(default=None, description="Pet age in years")
    sex: Optional[str] = Field(default=None, max_length=10, description="Pet sex")
    color: Optional[str] = Field(default=None, max_length=100, description="Pet color")
    size: Optional[str] = Field(default=None, max_length=50, description="Pet size")
    weight: Optional[str] = Field(default=None, max_length=50, description="Pet weight")
    microchip_id: Optional[str] = Field(
        default=None, max_length=255, description="Microchip ID"
    )
    is_spayed_neutered: bool = Field(default=False, description="Is spayed/neutered")
    birthday: Optional[date] = Field(default=None, description="Pet birthday")
    description: Optional[str] = Field(default=None, description="Pet description")
    photos: List[str] = Field(
        default_factory=list, sa_column=Column(JSON), description="Photo URLs"
    )
    medical_info: Dict[str, Any] = Field(
        default_factory=dict, sa_column=Column(JSON), description="Medical information"
    )
    owner_id: int = Field(foreign_key="tenant_users.id", description="Owner user ID")
    is_pinned: bool = Field(default=False, description="Is pet pinned to top of list")
    qr_code_id: Optional[str] = Field(
        default=None, max_length=255, description="Linked QR code identifier"
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
                "name": "Max",
                "breed": "Golden Retriever",
                "age": 3,
                "sex": "Male",
                "color": "Golden",
                "size": "Large",
                "weight": "65 lbs (29.5 kg)",
                "microchip_id": "982000123456789",
                "is_spayed_neutered": True,
                "birthday": "2021-03-15",
                "description": "Friendly and energetic dog who loves playing fetch.",
                "photos": ["https://example.com/photo1.jpg"],
                "medical_info": {
                    "vaccinations": "Up to date (2024)",
                    "vet": "Dr. Sarah Johnson",
                },
            }
        }


class QRCode(SQLModel, table=True):
    """
    QR code model for tracking codes and activation.

    Stores in {tenant_schema}.qr_codes table.
    """

    __tablename__ = "qr_codes"

    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(max_length=255, unique=True, description="Unique QR code")
    pin: str = Field(max_length=4, description="4-digit PIN code")
    pet_id: Optional[int] = Field(
        default=None, foreign_key="pets.id", description="Associated pet ID"
    )
    status: QRCodeStatus = Field(
        default=QRCodeStatus.INACTIVE, description="QR code status"
    )
    batch_id: Optional[str] = Field(
        default=None, max_length=255, description="Batch identifier"
    )
    print_data: Optional[Dict[str, Any]] = Field(
        default=None, sa_column=Column(JSON), description="Printing metadata"
    )
    activated_at: Optional[datetime] = Field(
        default=None, description="Activation timestamp"
    )
    activated_by_user_id: Optional[int] = Field(
        default=None, description="User ID who activated this QR code"
    )
    activation_count: int = Field(
        default=0, description="Number of times this QR code has been activated"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="Creation timestamp"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "code": "QR123456789",
                "pin": "1234",
                "status": "active",
                "batch_id": "BATCH001",
                "print_data": {"print_date": "2024-01-15", "factory": "PrintCorp"},
            }
        }


class ScanEvent(SQLModel, table=True):
    """
    QR code scan event tracking.

    Stores in {tenant_schema}.scan_events table.
    """

    __tablename__ = "scan_events"

    id: Optional[int] = Field(default=None, primary_key=True)
    qr_code_id: int = Field(foreign_key="qr_codes.id", description="QR code ID")
    ip_address: Optional[str] = Field(default=None, description="Scanner IP address")
    user_agent: Optional[str] = Field(default=None, description="Scanner user agent")
    location_data: Optional[Dict[str, Any]] = Field(
        default=None, sa_column=Column(JSON), description="Location information"
    )
    scanned_at: datetime = Field(
        default_factory=datetime.utcnow, description="Scan timestamp"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "qr_code_id": 1,
                "ip_address": "192.168.1.100",
                "user_agent": "Mozilla/5.0...",
                "location_data": {
                    "latitude": 40.7128,
                    "longitude": -74.0060,
                    "address": "New York, NY",
                },
            }
        }


class SupportTicket(SQLModel, table=True):
    """
    Support ticket model for customer service.

    Stores in {tenant_schema}.support_tickets table.
    """

    __tablename__ = "support_tickets"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(
        default=None, foreign_key="tenant_users.id", description="User ID"
    )
    subject: str = Field(max_length=255, description="Ticket subject")
    message: str = Field(description="Ticket message")
    status: TicketStatus = Field(default=TicketStatus.OPEN, description="Ticket status")
    priority: TicketPriority = Field(
        default=TicketPriority.MEDIUM, description="Ticket priority"
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
                "subject": "QR code not working",
                "message": "I can't activate my pet's QR code with the PIN.",
                "status": "open",
                "priority": "medium",
            }
        }
