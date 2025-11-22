"""
QR code service for handling QR code generation and management.
"""

import secrets
import string
from typing import List, Optional
from datetime import datetime
from sqlmodel import Session
from sqlalchemy import text

from ..models.tenant import QRCode, QRCodeStatus
from ..schemas.pet import QRCodeCreate, QRCodeUpdate
from ..database import get_engine


class QRCodeService:
    """Service for managing QR code operations."""

    def __init__(self, tenant_schema: str = "demo"):
        """Initialize QR code service with tenant schema."""
        self.tenant_schema = tenant_schema

    def _get_session(self) -> Session:
        """Get database session."""
        engine = get_engine()
        return Session(engine)

    def _set_search_path(self, session: Session):
        """Set the search path to tenant schema."""
        # Quote schema name to handle special characters like hyphens
        # Use connection().execute() to ensure search_path is set on the actual connection
        session.connection().execute(text(f'SET search_path TO "{self.tenant_schema}", public'))

    def _generate_qr_code(self) -> str:
        """Generate a unique QR code."""
        # Generate a 12-character alphanumeric code
        alphabet = string.ascii_uppercase + string.digits
        return "".join(secrets.choice(alphabet) for _ in range(12))

    def _generate_pin(self) -> str:
        """Generate a 4-digit PIN."""
        return "".join(secrets.choice(string.digits) for _ in range(4))

    def create_qr_code(self, qr_data: QRCodeCreate, owner_id: int) -> QRCode:
        """
        Create a new QR code.

        Args:
            qr_data: QR code creation data
            owner_id: ID of the QR code owner (shared user ID)

        Returns:
            QRCode: Created QR code instance
        """
        session = self._get_session()
        try:
            self._set_search_path(session)

            # Generate unique code
            code = self._generate_qr_code()

            # Check for code uniqueness
            while session.query(QRCode).filter(QRCode.code == code).first():
                code = self._generate_qr_code()

            # Generate PIN if not provided
            pin = qr_data.pin if qr_data.pin else self._generate_pin()

            # Create QR code instance
            qr_code = QRCode(
                code=code,
                pin=pin,
                pet_id=qr_data.pet_id,
                status=QRCodeStatus.INACTIVE,
                batch_id=qr_data.batch_id,
                print_data={"physical_format": qr_data.physical_format or "sticker"},
                created_at=datetime.utcnow(),
            )

            session.add(qr_code)
            session.commit()
            # Re-set search path after commit as it may be reset
            self._set_search_path(session)
            session.refresh(qr_code)
            return qr_code
        finally:
            session.close()

    def get_qr_code(self, qr_id: int) -> Optional[QRCode]:
        """
        Get a QR code by ID.

        Args:
            qr_id: QR code ID

        Returns:
            QRCode: QR code instance or None if not found
        """
        session = self._get_session()
        try:
            self._set_search_path(session)
            return session.query(QRCode).filter(QRCode.id == qr_id).first()
        finally:
            session.close()

    def get_qr_code_by_code(self, code: str) -> Optional[QRCode]:
        """
        Get a QR code by its code string.

        Args:
            code: QR code string

        Returns:
            QRCode: QR code instance or None if not found
        """
        session = self._get_session()
        try:
            self._set_search_path(session)
            return session.query(QRCode).filter(QRCode.code == code).first()
        finally:
            session.close()

    def get_qr_codes_by_pet(self, pet_id: int) -> List[QRCode]:
        """
        Get QR codes associated with a pet.

        Args:
            pet_id: Pet ID

        Returns:
            List[QRCode]: List of QR codes
        """
        session = self._get_session()
        try:
            self._set_search_path(session)
            return session.query(QRCode).filter(QRCode.pet_id == pet_id).all()
        finally:
            session.close()

    def get_all_qr_codes(self, skip: int = 0, limit: int = 100) -> List[QRCode]:
        """
        Get all QR codes.

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List[QRCode]: List of all QR codes
        """
        session = self._get_session()
        try:
            self._set_search_path(session)
            return (
                session.query(QRCode)
                .order_by(QRCode.created_at.desc())
                .offset(skip)
                .limit(limit)
                .all()
            )
        finally:
            session.close()

    def get_unassigned_qr_codes(self, skip: int = 0, limit: int = 100) -> List[QRCode]:
        """
        Get unassigned QR codes.

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List[QRCode]: List of unassigned QR codes
        """
        session = self._get_session()
        try:
            self._set_search_path(session)
            return (
                session.query(QRCode)
                .filter(QRCode.pet_id == None)
                .offset(skip)
                .limit(limit)
                .all()
            )
        finally:
            session.close()

    def get_qr_codes_by_owner(
        self, owner_id: int, skip: int = 0, limit: int = 100
    ) -> List[QRCode]:
        """
        Get QR codes associated with a specific user.

        Returns QR codes that are either:
        - Linked to pets owned by this user
        - Activated by this user (even if not yet linked to a pet)

        Args:
            owner_id: Owner user ID (shared user ID)
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List[QRCode]: List of QR codes for the owner
        """
        from ..models.tenant import Pet
        from sqlalchemy import or_

        session = self._get_session()
        try:
            self._set_search_path(session)

            # Get tenant user ID from shared user ID
            shared_user = session.execute(
                text("SELECT email FROM shared.users WHERE id = :user_id"),
                {"user_id": owner_id},
            ).fetchone()

            if not shared_user:
                return []

            tenant_user = session.execute(
                text("SELECT id FROM tenant_users WHERE email = :email"),
                {"email": shared_user[0]},
            ).fetchone()

            if not tenant_user:
                return []

            tenant_user_id = tenant_user[0]

            # Get QR codes that are:
            # 1. Linked to pets owned by this user, OR
            # 2. Activated by this user (not linked to a pet yet)
            return (
                session.query(QRCode)
                .outerjoin(Pet, QRCode.pet_id == Pet.id)
                .filter(
                    or_(
                        Pet.owner_id == tenant_user_id,
                        QRCode.activated_by_user_id == tenant_user_id
                    )
                )
                .order_by(QRCode.created_at.desc())
                .offset(skip)
                .limit(limit)
                .all()
            )
        finally:
            session.close()

    def assign_qr_code_to_pet(self, qr_id: int, pet_id: int) -> Optional[QRCode]:
        """
        Assign a QR code to a pet.

        Args:
            qr_id: QR code ID
            pet_id: Pet ID

        Returns:
            QRCode: Updated QR code instance or None if not found
        """
        session = self._get_session()
        try:
            self._set_search_path(session)

            qr_code = session.query(QRCode).filter(QRCode.id == qr_id).first()
            if not qr_code:
                return None

            qr_code.pet_id = pet_id
            qr_code.status = QRCodeStatus.ACTIVE
            qr_code.activated_at = datetime.utcnow()

            session.commit()
            # Re-set search path after commit as it may be reset
            self._set_search_path(session)
            session.refresh(qr_code)
            return qr_code
        finally:
            session.close()

    def update_qr_code(self, qr_id: int, qr_data: QRCodeUpdate) -> Optional[QRCode]:
        """
        Update a QR code.

        Args:
            qr_id: QR code ID
            qr_data: QR code update data

        Returns:
            QRCode: Updated QR code instance or None if not found
        """
        session = self._get_session()
        try:
            self._set_search_path(session)

            qr_code = session.query(QRCode).filter(QRCode.id == qr_id).first()
            if not qr_code:
                return None

            # Update fields that are provided
            update_data = qr_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(qr_code, field, value)

            session.commit()
            # Re-set search path after commit as it may be reset
            self._set_search_path(session)
            session.refresh(qr_code)
            return qr_code
        finally:
            session.close()

    def activate_qr_code(self, code: str, pet_id: int) -> Optional[QRCode]:
        """
        Activate a QR code and associate it with a pet.

        Args:
            code: QR code string
            pet_id: Pet ID

        Returns:
            QRCode: Activated QR code instance or None if not found
        """
        session = self._get_session()
        try:
            self._set_search_path(session)

            qr_code = session.query(QRCode).filter(QRCode.code == code).first()
            if not qr_code or qr_code.status != QRCodeStatus.INACTIVE:
                return None

            qr_code.pet_id = pet_id
            qr_code.status = QRCodeStatus.ACTIVE
            qr_code.activated_at = datetime.utcnow()

            session.commit()
            # Re-set search path after commit as it may be reset
            self._set_search_path(session)
            session.refresh(qr_code)
            return qr_code
        finally:
            session.close()

    def verify_qr_code_pin(self, code: str, pin: str) -> bool:
        """
        Verify a QR code PIN.

        Args:
            code: QR code string
            pin: PIN to verify

        Returns:
            bool: True if PIN is correct, False otherwise
        """
        session = self._get_session()
        try:
            self._set_search_path(session)

            qr_code = session.query(QRCode).filter(QRCode.code == code).first()
            if not qr_code:
                return False

            return qr_code.pin == pin
        finally:
            session.close()

    def delete_qr_code(self, qr_id: int) -> bool:
        """
        Delete a QR code.

        Args:
            qr_id: QR code ID

        Returns:
            bool: True if deleted successfully, False otherwise
        """
        session = self._get_session()
        try:
            self._set_search_path(session)

            qr_code = session.query(QRCode).filter(QRCode.id == qr_id).first()
            if not qr_code:
                return False

            session.delete(qr_code)
            session.commit()
            return True
        except Exception:
            session.rollback()
            return False
        finally:
            session.close()

    def generate_batch_qr_codes(
        self, quantity: int, batch_id: str = None, physical_format: str = "sticker"
    ) -> List[QRCode]:
        """
        Generate a batch of QR codes.

        Args:
            quantity: Number of QR codes to generate
            batch_id: Optional batch identifier
            physical_format: Physical format (e.g., "sticker", "tag")

        Returns:
            List[QRCode]: List of generated QR codes
        """
        if quantity > 1000000:
            raise ValueError("Cannot generate more than 1000000 QR codes at once")

        session = self._get_session()
        try:
            self._set_search_path(session)

            generated_codes = []
            batch_identifier = (
                batch_id or f"BATCH_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            )

            for _ in range(quantity):
                # Generate unique code
                code = self._generate_qr_code()
                while session.query(QRCode).filter(QRCode.code == code).first():
                    code = self._generate_qr_code()

                qr_code = QRCode(
                    code=code,
                    pin=self._generate_pin(),
                    status=QRCodeStatus.INACTIVE,
                    batch_id=batch_identifier,
                    print_data={"physical_format": physical_format},
                    created_at=datetime.utcnow(),
                )

                session.add(qr_code)
                generated_codes.append(qr_code)

            session.commit()
            # Re-set search path after commit as it may be reset
            self._set_search_path(session)

            # Refresh all objects
            for qr_code in generated_codes:
                session.refresh(qr_code)

            return generated_codes
        finally:
            session.close()
