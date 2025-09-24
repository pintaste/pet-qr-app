"""
Pet models for the Pet QR System.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, date
from sqlmodel import SQLModel, Field, JSON, Column, Relationship
from enum import Enum


class PetType(str, Enum):
    """Pet type enumeration."""
    DOG = "dog"
    CAT = "cat"
    BIRD = "bird"
    RABBIT = "rabbit"
    FISH = "fish"
    REPTILE = "reptile"
    OTHER = "other"


class PetGender(str, Enum):
    """Pet gender enumeration."""
    MALE = "male"
    FEMALE = "female"
    UNKNOWN = "unknown"


class PetSize(str, Enum):
    """Pet size enumeration."""
    XS = "xs"  # Extra Small (e.g., hamster, bird)
    S = "s"    # Small (e.g., chihuahua, cat)
    M = "m"    # Medium (e.g., beagle, cocker spaniel)
    L = "l"    # Large (e.g., golden retriever, german shepherd)
    XL = "xl"  # Extra Large (e.g., great dane, mastiff)


class Pet(SQLModel, table=True):
    """
    Pet model for storing pet information.

    Stores in tenant-specific schemas (e.g., tenant1.pets).
    """
    __tablename__ = "pets"

    id: Optional[int] = Field(default=None, primary_key=True)

    # Basic Information
    name: str = Field(max_length=100, description="Pet name")
    pet_type: PetType = Field(description="Type of pet")
    breed: Optional[str] = Field(default=None, max_length=100, description="Pet breed")
    gender: PetGender = Field(default=PetGender.UNKNOWN, description="Pet gender")
    size: Optional[PetSize] = Field(default=None, description="Pet size")

    # Age Information
    birth_date: Optional[date] = Field(default=None, description="Pet birth date")
    age_months: Optional[int] = Field(default=None, description="Age in months (if birth date unknown)")

    # Physical Characteristics
    color: Optional[str] = Field(default=None, max_length=100, description="Pet color/markings")
    weight_kg: Optional[float] = Field(default=None, description="Weight in kilograms")
    microchip_id: Optional[str] = Field(default=None, max_length=50, description="Microchip ID")

    # Description and Personality
    description: Optional[str] = Field(default=None, max_length=1000, description="Pet description")
    personality_traits: Optional[List[str]] = Field(
        default_factory=list,
        sa_column=Column(JSON),
        description="Personality traits"
    )
    special_needs: Optional[str] = Field(default=None, max_length=500, description="Special needs or requirements")

    # Medical Information
    medical_info: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        sa_column=Column(JSON),
        description="Medical information (vaccinations, allergies, etc.)"
    )
    vet_info: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        sa_column=Column(JSON),
        description="Veterinarian contact information"
    )

    # Photos and Media
    profile_photo_url: Optional[str] = Field(default=None, max_length=500, description="Main profile photo URL")
    photo_urls: Optional[List[str]] = Field(
        default_factory=list,
        sa_column=Column(JSON),
        description="Additional photo URLs"
    )

    # Owner Information
    owner_id: int = Field(foreign_key="shared.users.id", description="Pet owner user ID")

    # Emergency Contact (can be different from owner)
    emergency_contact: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        sa_column=Column(JSON),
        description="Emergency contact information"
    )

    # Status and Visibility
    is_active: bool = Field(default=True, description="Is pet profile active")
    is_lost: bool = Field(default=False, description="Is pet currently lost")
    is_public: bool = Field(default=True, description="Is pet profile visible to public via QR")

    # Location Information (for lost pets)
    last_known_location: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        sa_column=Column(JSON),
        description="Last known location (latitude, longitude, address)"
    )

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Max",
                "pet_type": "dog",
                "breed": "Golden Retriever",
                "gender": "male",
                "size": "l",
                "birth_date": "2021-06-15",
                "color": "Golden/Cream",
                "weight_kg": 28.5,
                "microchip_id": "982000123456789",
                "description": "Friendly and energetic dog who loves playing fetch and swimming.",
                "personality_traits": ["friendly", "energetic", "social", "playful"],
                "medical_info": {
                    "vaccinations": {
                        "rabies": "2024-06-15",
                        "dhpp": "2024-06-15"
                    },
                    "allergies": [],
                    "medications": []
                },
                "vet_info": {
                    "clinic_name": "Happy Pets Clinic",
                    "vet_name": "Dr. Sarah Johnson",
                    "phone": "+1 (555) 123-4567",
                    "address": "123 Pet Street, City, State 12345"
                },
                "emergency_contact": {
                    "name": "Jane Smith",
                    "relationship": "spouse",
                    "phone": "+1 (555) 987-6543",
                    "email": "jane.smith@email.com"
                }
            }
        }


class QRCode(SQLModel, table=True):
    """
    QR Code model for pet identification.

    Stores in tenant-specific schemas (e.g., tenant1.qr_codes).
    """
    __tablename__ = "qr_codes"

    id: Optional[int] = Field(default=None, primary_key=True)

    # QR Code Identification
    code: str = Field(unique=True, max_length=50, description="Unique QR code identifier")
    pin: Optional[str] = Field(default=None, max_length=10, description="PIN for accessing pet info")

    # Associated Pet
    pet_id: Optional[int] = Field(default=None, foreign_key="pets.id", description="Associated pet ID")

    # QR Code Properties
    qr_image_url: Optional[str] = Field(default=None, max_length=500, description="Generated QR code image URL")
    qr_data: Optional[str] = Field(default=None, max_length=500, description="QR code data content")

    # Physical QR Code Info
    batch_id: Optional[str] = Field(default=None, max_length=50, description="Manufacturing batch ID")
    physical_format: Optional[str] = Field(default="sticker", max_length=50, description="Physical format (sticker, tag, etc.)")

    # Usage Tracking
    scan_count: int = Field(default=0, description="Number of times scanned")
    last_scanned_at: Optional[datetime] = Field(default=None, description="Last scan timestamp")
    last_scan_location: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        sa_column=Column(JSON),
        description="Last scan location data"
    )

    # Status
    is_active: bool = Field(default=True, description="Is QR code active")
    is_assigned: bool = Field(default=False, description="Is QR code assigned to a pet")

    # Owner Information
    owner_id: Optional[int] = Field(default=None, foreign_key="shared.users.id", description="QR code owner")

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    assigned_at: Optional[datetime] = Field(default=None, description="Assignment timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "code": "PQR123456789",
                "pin": "1234",
                "pet_id": 1,
                "batch_id": "BATCH2024001",
                "physical_format": "sticker",
                "scan_count": 15,
                "is_active": True,
                "is_assigned": True
            }
        }


class PetScanLog(SQLModel, table=True):
    """
    Log of QR code scans for analytics and tracking.

    Stores in tenant-specific schemas (e.g., tenant1.pet_scan_logs).
    """
    __tablename__ = "pet_scan_logs"

    id: Optional[int] = Field(default=None, primary_key=True)

    # Scan Information
    qr_code_id: int = Field(foreign_key="qr_codes.id", description="QR code that was scanned")
    pet_id: Optional[int] = Field(default=None, foreign_key="pets.id", description="Pet associated with QR code")

    # Scanner Information (anonymous)
    scanner_ip: Optional[str] = Field(default=None, max_length=45, description="Scanner IP address")
    user_agent: Optional[str] = Field(default=None, max_length=500, description="Scanner user agent")

    # Location Data
    scan_location: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        sa_column=Column(JSON),
        description="Scan location (if provided by scanner)"
    )

    # Scan Context
    scan_method: Optional[str] = Field(default="qr_scan", max_length=50, description="How the scan was performed")
    access_granted: bool = Field(default=False, description="Was access to pet info granted")
    pin_verified: bool = Field(default=False, description="Was PIN verification successful")

    # Timestamp
    scanned_at: datetime = Field(default_factory=datetime.utcnow, description="Scan timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "qr_code_id": 1,
                "pet_id": 1,
                "scanner_ip": "192.168.1.100",
                "scan_location": {
                    "latitude": 40.7128,
                    "longitude": -74.0060,
                    "address": "New York, NY"
                },
                "access_granted": True,
                "pin_verified": True
            }
        }