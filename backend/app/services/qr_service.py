"""
QR code generation and PIN verification service.
"""

import uuid
import secrets
import string
from typing import List, Optional, Dict, Any
from io import BytesIO
import base64
from PIL import Image, ImageDraw, ImageFont
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from fastapi import HTTPException, status
from sqlmodel import Session, select
from app.core.config import settings
from app.services.auth_service import auth_service
from app.models.tenant import QRCode, Pet
from app.models.shared import Tenant


class QRService:
    """
    QR code generation and management service with PIN verification.
    """

    def __init__(self):
        """Initialize QR service."""
        self.base_url = settings.QR_CODE_BASE_URL
        self.default_size = settings.DEFAULT_QR_SIZE

    def generate_pin(self) -> str:
        """
        Generate a secure 4-digit PIN.

        Returns:
            str: 4-digit PIN.
        """
        return ''.join(secrets.choice(string.digits) for _ in range(4))

    def generate_qr_code(self) -> str:
        """
        Generate a unique QR code identifier.

        Returns:
            str: Unique QR code identifier.
        """
        return str(uuid.uuid4())

    def hash_pin(self, pin: str) -> str:
        """
        Hash a PIN for secure storage.

        Args:
            pin (str): Plain text PIN.

        Returns:
            str: Hashed PIN.
        """
        return auth_service.hash_password(pin)

    def verify_pin(self, plain_pin: str, hashed_pin: str) -> bool:
        """
        Verify a PIN against its hash.

        Args:
            plain_pin (str): Plain text PIN.
            hashed_pin (str): Hashed PIN.

        Returns:
            bool: True if PIN matches.
        """
        return auth_service.verify_password(plain_pin, hashed_pin)

    def create_qr_image(
        self,
        qr_code: str,
        tenant: Tenant,
        size: int = None,
        include_logo: bool = True
    ) -> str:
        """
        Create QR code image with tenant branding.

        Args:
            qr_code (str): QR code identifier.
            tenant (Tenant): Tenant for branding.
            size (int): QR code size in pixels.
            include_logo (bool): Whether to include tenant logo.

        Returns:
            str: Base64 encoded QR code image.
        """
        size = size or self.default_size

        # Create QR code URL
        qr_url = f"{self.base_url}/{qr_code}"

        # Create QR code instance
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_url)
        qr.make(fit=True)

        # Get tenant theme colors
        theme = tenant.settings.get("theme", {})
        primary_color = theme.get("primary_color", "#4F46E5")  # Default indigo
        background_color = theme.get("background_color", "#FFFFFF")

        # Create styled QR code image
        img = qr.make_image(
            image_factory=StyledPilImage,
            module_drawer=RoundedModuleDrawer(),
            fill_color=primary_color,
            back_color=background_color
        )

        # Resize to specified size
        img = img.resize((size, size), Image.Resampling.LANCZOS)

        # Add tenant logo if specified and available
        if include_logo and tenant.settings.get("logo_url"):
            try:
                # In a real implementation, you would fetch the logo from S3/CloudFront
                # For now, we'll add a placeholder text overlay
                draw = ImageDraw.Draw(img)

                # Add tenant name as text overlay (simple branding)
                font_size = max(12, size // 20)
                try:
                    font = ImageFont.truetype("arial.ttf", font_size)
                except:
                    font = ImageFont.load_default()

                text = tenant.name[:10]  # Limit text length
                bbox = draw.textbbox((0, 0), text, font=font)
                text_width = bbox[2] - bbox[0]
                text_height = bbox[3] - bbox[1]

                # Position at bottom center
                x = (size - text_width) // 2
                y = size - text_height - 10

                # Add background rectangle for text
                padding = 4
                draw.rectangle(
                    [x - padding, y - padding, x + text_width + padding, y + text_height + padding],
                    fill=background_color,
                    outline=primary_color
                )

                # Draw text
                draw.text((x, y), text, font=font, fill=primary_color)

            except Exception:
                # Continue without logo if there's an error
                pass

        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()

        return f"data:image/png;base64,{img_str}"

    def create_qr_batch(
        self,
        db: Session,
        tenant: Tenant,
        count: int,
        batch_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Create a batch of QR codes for a tenant.

        Args:
            db (Session): Database session.
            tenant (Tenant): Tenant to create QR codes for.
            count (int): Number of QR codes to create.
            batch_name (Optional[str]): Optional batch name for organization.

        Returns:
            List[Dict[str, Any]]: List of created QR codes with PINs.

        Raises:
            HTTPException: If batch creation fails.
        """
        if count <= 0 or count > 1000:  # Reasonable limit
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Count must be between 1 and 1000"
            )

        qr_codes = []

        try:
            for i in range(count):
                # Generate QR code and PIN
                qr_code = self.generate_qr_code()
                pin = self.generate_pin()
                pin_hash = self.hash_pin(pin)

                # Create QR code record
                qr_record = QRCode(
                    code=qr_code,
                    pin_hash=pin_hash,
                    status="inactive",
                    batch_name=batch_name,
                    tenant_id=tenant.id
                )

                db.add(qr_record)

                # Create QR code image
                qr_image = self.create_qr_image(qr_code, tenant)

                qr_codes.append({
                    "id": None,  # Will be set after commit
                    "code": qr_code,
                    "pin": pin,  # Return plain PIN for initial setup
                    "status": "inactive",
                    "image": qr_image,
                    "url": f"{self.base_url}/{qr_code}",
                    "batch_name": batch_name
                })

            # Commit all QR codes
            db.commit()

            # Update IDs after commit
            for i, qr_data in enumerate(qr_codes):
                qr_record = db.exec(
                    select(QRCode).where(QRCode.code == qr_data["code"])
                ).first()
                if qr_record:
                    qr_data["id"] = qr_record.id

            return qr_codes

        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create QR batch: {str(e)}"
            )

    def verify_qr_pin(
        self,
        db: Session,
        qr_code: str,
        pin: str
    ) -> Optional[QRCode]:
        """
        Verify QR code and PIN combination.

        Args:
            db (Session): Database session.
            qr_code (str): QR code identifier.
            pin (str): PIN to verify.

        Returns:
            Optional[QRCode]: QR code record if verification successful.
        """
        # Get QR code record
        qr_record = db.exec(
            select(QRCode).where(QRCode.code == qr_code)
        ).first()

        if not qr_record:
            return None

        # Verify PIN
        if not self.verify_pin(pin, qr_record.pin_hash):
            return None

        return qr_record

    def activate_qr_code(
        self,
        db: Session,
        qr_code: str,
        pin: str,
        pet_id: Optional[int] = None
    ) -> QRCode:
        """
        Activate a QR code with PIN verification.

        Args:
            db (Session): Database session.
            qr_code (str): QR code identifier.
            pin (str): PIN for verification.
            pet_id (Optional[int]): Pet ID to associate with QR code.

        Returns:
            QRCode: Activated QR code record.

        Raises:
            HTTPException: If activation fails.
        """
        # Verify QR code and PIN
        qr_record = self.verify_qr_pin(db, qr_code, pin)

        if not qr_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid QR code or PIN"
            )

        # Check if already activated
        if qr_record.status == "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="QR code is already activated"
            )

        try:
            # Activate QR code
            qr_record.status = "active"
            qr_record.pet_id = pet_id
            qr_record.activated_at = None  # Will be set by SQLModel

            db.add(qr_record)
            db.commit()
            db.refresh(qr_record)

            return qr_record

        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to activate QR code: {str(e)}"
            )

    def get_qr_pet_info(
        self,
        db: Session,
        qr_code: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get pet information associated with QR code.

        Args:
            db (Session): Database session.
            qr_code (str): QR code identifier.

        Returns:
            Optional[Dict[str, Any]]: Pet information if QR code is active.
        """
        # Get QR code record
        qr_record = db.exec(
            select(QRCode).where(QRCode.code == qr_code)
        ).first()

        if not qr_record or qr_record.status != "active" or not qr_record.pet_id:
            return None

        # Get associated pet
        pet = db.exec(
            select(Pet).where(Pet.id == qr_record.pet_id)
        ).first()

        if not pet:
            return None

        return {
            "qr_code_id": qr_record.id,
            "pet_id": pet.id,
            "pet_name": pet.name,
            "pet_breed": pet.breed,
            "pet_age_months": pet.age_months,
            "pet_photos": pet.photos,
            "pet_description": pet.description,
            "pet_medical_info": pet.medical_info,
            "owner_id": pet.owner_id,
            "contact_info": pet.contact_info,
            "status": qr_record.status
        }

    def record_scan_event(
        self,
        db: Session,
        qr_code: str,
        location: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> None:
        """
        Record a QR code scan event for analytics.

        Args:
            db (Session): Database session.
            qr_code (str): QR code identifier.
            location (Optional[str]): Scan location.
            ip_address (Optional[str]): Scanner IP address.
            user_agent (Optional[str]): Scanner user agent.
        """
        try:
            # Get QR code record
            qr_record = db.exec(
                select(QRCode).where(QRCode.code == qr_code)
            ).first()

            if qr_record:
                from app.models.tenant import ScanEvent

                scan_event = ScanEvent(
                    qr_code_id=qr_record.id,
                    location=location,
                    ip_address=ip_address,
                    user_agent=user_agent
                )

                db.add(scan_event)
                db.commit()

        except Exception:
            # Don't let scan recording failures break the main flow
            db.rollback()


# Global QR service instance
qr_service = QRService()