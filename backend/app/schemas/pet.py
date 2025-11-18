"""
Pet-related Pydantic schemas for API requests and responses.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel, Field


class PetCreate(BaseModel):
    """Schema for creating a new pet."""

    # Basic Information
    name: str = Field(..., min_length=1, max_length=255, description="Pet name")
    breed: Optional[str] = Field(None, max_length=255, description="Pet breed")
    age: Optional[int] = Field(None, ge=0, le=50, description="Pet age in years")
    sex: Optional[str] = Field(None, max_length=10, description="Pet sex")
    color: Optional[str] = Field(None, max_length=100, description="Pet color/markings")
    size: Optional[str] = Field(None, max_length=50, description="Pet size")
    weight: Optional[str] = Field(None, max_length=50, description="Pet weight")
    microchip_id: Optional[str] = Field(
        None, max_length=255, description="Microchip ID"
    )
    is_spayed_neutered: Optional[bool] = Field(
        False, description="Is pet spayed/neutered"
    )
    birthday: Optional[date] = Field(None, description="Pet birthday")
    description: Optional[str] = Field(None, description="Pet description")
    photos: Optional[List[str]] = Field(default_factory=list, description="Photo URLs")
    medical_info: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="Medical information"
    )


class PetUpdate(BaseModel):
    """Schema for updating an existing pet."""

    # All fields are optional for updates
    name: Optional[str] = Field(
        None, min_length=1, max_length=255, description="Pet name"
    )
    breed: Optional[str] = Field(None, max_length=255, description="Pet breed")
    age: Optional[int] = Field(None, ge=0, le=50, description="Pet age in years")
    sex: Optional[str] = Field(None, max_length=10, description="Pet sex")
    color: Optional[str] = Field(None, max_length=100, description="Pet color/markings")
    size: Optional[str] = Field(None, max_length=50, description="Pet size")
    weight: Optional[str] = Field(None, max_length=50, description="Pet weight")
    microchip_id: Optional[str] = Field(
        None, max_length=255, description="Microchip ID"
    )
    is_spayed_neutered: Optional[bool] = Field(
        None, description="Is pet spayed/neutered"
    )
    birthday: Optional[date] = Field(None, description="Pet birthday")
    description: Optional[str] = Field(None, description="Pet description")
    photos: Optional[List[str]] = Field(None, description="Photo URLs")
    medical_info: Optional[Dict[str, Any]] = Field(
        None, description="Medical information"
    )


class PetResponse(BaseModel):
    """Schema for pet response."""

    id: int
    name: str
    breed: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None
    color: Optional[str] = None
    size: Optional[str] = None
    weight: Optional[str] = None
    microchip_id: Optional[str] = None
    is_spayed_neutered: bool = False
    birthday: Optional[date] = None
    description: Optional[str] = None
    photos: List[str] = []
    medical_info: Dict[str, Any] = {}
    owner_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PetPublicResponse(BaseModel):
    """Schema for public pet information (accessed via QR code)."""

    name: str
    breed: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None
    size: Optional[str] = None

    color: Optional[str] = None
    description: Optional[str] = None
    personality_traits: List[str] = []

    profile_photo_url: Optional[str] = None
    photo_urls: List[str] = []

    # Limited medical info for public
    basic_medical_info: Optional[Dict[str, Any]] = Field(
        None, description="Basic medical information (vaccinations status, etc.)"
    )

    # Emergency contact information
    emergency_contact: Dict[str, Any] = {}

    # Status
    is_lost: bool
    last_known_location: Optional[Dict[str, Any]] = None


class QRCodeCreate(BaseModel):
    """Schema for creating a QR code."""

    pet_id: Optional[int] = Field(None, description="Pet ID to associate with QR code")
    pin: Optional[str] = Field(
        None, min_length=4, max_length=10, description="PIN for accessing pet info"
    )
    physical_format: Optional[str] = Field(
        "sticker", max_length=50, description="Physical format"
    )
    batch_id: Optional[str] = Field(
        None, max_length=50, description="Manufacturing batch ID"
    )


class QRCodeUpdate(BaseModel):
    """Schema for updating a QR code."""

    pet_id: Optional[int] = Field(None, description="Pet ID to associate with QR code")
    pin: Optional[str] = Field(
        None, min_length=4, max_length=10, description="PIN for accessing pet info"
    )
    is_active: Optional[bool] = Field(None, description="Is QR code active")


class QRCodeResponse(BaseModel):
    """Schema for QR code response."""

    id: int
    code: str
    pin: str
    pet_id: Optional[int] = None
    status: str
    batch_id: Optional[str] = None
    print_data: Optional[Dict[str, Any]] = None
    activated_at: Optional[datetime] = None
    created_at: datetime

    @property
    def physical_format(self) -> Optional[str]:
        """Extract physical format from print_data."""
        if self.print_data and isinstance(self.print_data, dict):
            return self.print_data.get("physical_format")
        return None

    @property
    def is_active(self) -> bool:
        """Check if QR code is active."""
        return self.status == "active"

    @property
    def is_assigned(self) -> bool:
        """Check if QR code is assigned to a pet."""
        return self.pet_id is not None

    class Config:
        from_attributes = True


class QRCodePublicResponse(BaseModel):
    """Schema for public QR code information."""

    code: str
    is_active: bool
    is_assigned: bool
    requires_pin: bool = Field(
        ..., description="Whether PIN is required to access pet info"
    )
    pet_info: Optional[PetPublicResponse] = None


class QRCodeVerifyRequest(BaseModel):
    """Schema for QR code PIN verification."""

    qr_code: str = Field(..., description="QR code identifier")
    pin: str = Field(..., min_length=4, max_length=10, description="PIN to verify")


class QRCodeVerifyResponse(BaseModel):
    """Schema for QR code verification response."""

    success: bool
    status: Optional[str] = None
    message: str
    pet_id: Optional[int] = None
    pet_info: Optional[PetPublicResponse] = None


class PetScanLogCreate(BaseModel):
    """Schema for creating a scan log entry."""

    qr_code_id: int
    scanner_ip: Optional[str] = None
    user_agent: Optional[str] = None
    scan_location: Optional[Dict[str, Any]] = None
    scan_method: Optional[str] = "qr_scan"
    access_granted: bool = False
    pin_verified: bool = False


class PetScanLogResponse(BaseModel):
    """Schema for scan log response."""

    id: int
    qr_code_id: int
    pet_id: Optional[int] = None

    scanner_ip: Optional[str] = None
    scan_location: Dict[str, Any] = {}

    scan_method: str
    access_granted: bool
    pin_verified: bool

    scanned_at: datetime

    class Config:
        from_attributes = True


class BatchQRCodeGenerate(BaseModel):
    """Schema for generating batch of QR codes."""

    quantity: int = Field(
        ..., ge=1, le=1000, description="Number of QR codes to generate"
    )
    batch_id: Optional[str] = Field(None, max_length=50, description="Batch identifier")
    physical_format: Optional[str] = Field(
        "sticker", max_length=50, description="Physical format"
    )
    auto_assign_pins: bool = Field(True, description="Automatically generate PINs")


class BatchQRCodeResponse(BaseModel):
    """Schema for batch QR code generation response."""

    batch_id: str
    quantity: int
    qr_codes: List[QRCodeResponse]
    created_at: datetime
