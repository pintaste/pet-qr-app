"""
Pet service for handling pet-related business logic.
"""

from typing import List, Optional
from datetime import datetime
from sqlmodel import Session
from sqlalchemy import text

from ..models.tenant import Pet
from ..schemas.pet import PetCreate, PetUpdate
from ..database import get_engine


class PetService:
    """Service for managing pet operations."""

    def __init__(self, tenant_schema: str = "demo"):
        """Initialize pet service with tenant schema."""
        self.tenant_schema = tenant_schema

    def _get_session(self) -> Session:
        """Get database session."""
        engine = get_engine()
        return Session(engine)

    def _set_search_path(self, session: Session):
        """Set the search path to tenant schema."""
        session.execute(text(f"SET search_path TO {self.tenant_schema}, public"))

    def _get_tenant_user_id(self, shared_user_id: int) -> int:
        """Get tenant user ID from shared user ID."""
        session = self._get_session()
        try:
            self._set_search_path(session)

            # Get the user email from shared schema
            shared_user = session.execute(
                text("SELECT email FROM shared.users WHERE id = :user_id"),
                {"user_id": shared_user_id}
            ).fetchone()

            if not shared_user:
                raise ValueError(f"User {shared_user_id} not found in shared.users")

            # Find or create corresponding tenant user
            tenant_user = session.execute(
                text("SELECT id FROM tenant_users WHERE email = :email"),
                {"email": shared_user[0]}
            ).fetchone()

            if not tenant_user:
                # Create tenant user record
                result = session.execute(
                    text("""
                        INSERT INTO tenant_users (email, password_hash, first_name, last_name,
                                                   language, privacy_settings, is_active, created_at, updated_at)
                        VALUES (:email, 'shared_auth', 'User', 'User', 'en',
                                '{"show_email": false, "show_phone": true}', true, NOW(), NOW())
                        RETURNING id
                    """),
                    {"email": shared_user[0]}
                )
                tenant_user_id = result.fetchone()[0]
                session.commit()
                return tenant_user_id

            return tenant_user[0]
        finally:
            session.close()

    def create_pet(self, pet_data: PetCreate, owner_id: int) -> Pet:
        """
        Create a new pet.

        Args:
            pet_data: Pet creation data
            owner_id: ID of the pet owner (shared user ID)

        Returns:
            Pet: Created pet instance
        """
        session = self._get_session()
        try:
            self._set_search_path(session)

            # Map shared user ID to tenant user ID
            tenant_user_id = self._get_tenant_user_id(owner_id)

            # Create pet instance
            pet = Pet(
                name=pet_data.name,
                breed=pet_data.breed,
                age=pet_data.age,
                sex=pet_data.sex,
                color=pet_data.color,
                size=pet_data.size,
                weight=pet_data.weight,
                microchip_id=pet_data.microchip_id,
                is_spayed_neutered=pet_data.is_spayed_neutered or False,
                birthday=pet_data.birthday,
                description=pet_data.description,
                photos=pet_data.photos or [],
                medical_info=pet_data.medical_info or {},
                owner_id=tenant_user_id,  # Use tenant user ID
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )

            session.add(pet)
            session.commit()
            session.refresh(pet)
            return pet
        finally:
            session.close()

    def get_pet(self, pet_id: int) -> Optional[Pet]:
        """
        Get a pet by ID.

        Args:
            pet_id: Pet ID

        Returns:
            Pet: Pet instance or None if not found
        """
        session = self._get_session()
        try:
            self._set_search_path(session)
            return session.query(Pet).filter(Pet.id == pet_id, Pet.is_active == True).first()
        finally:
            session.close()

    def get_pets_by_owner(self, owner_id: int, skip: int = 0, limit: int = 100) -> List[Pet]:
        """
        Get pets by owner ID.

        Args:
            owner_id: Owner ID (shared user ID)
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List[Pet]: List of pets
        """
        session = self._get_session()
        try:
            self._set_search_path(session)

            # Map shared user ID to tenant user ID
            tenant_user_id = self._get_tenant_user_id(owner_id)

            return (
                session.query(Pet)
                .filter(Pet.owner_id == tenant_user_id, Pet.is_active == True)
                .offset(skip)
                .limit(limit)
                .all()
            )
        finally:
            session.close()

    def update_pet(self, pet_id: int, pet_data: PetUpdate, owner_id: int) -> Optional[Pet]:
        """
        Update a pet.

        Args:
            pet_id: Pet ID
            pet_data: Pet update data
            owner_id: Owner ID (shared user ID, for authorization)

        Returns:
            Pet: Updated pet instance or None if not found
        """
        session = self._get_session()
        try:
            self._set_search_path(session)

            # Map shared user ID to tenant user ID
            tenant_user_id = self._get_tenant_user_id(owner_id)

            pet = session.query(Pet).filter(
                Pet.id == pet_id,
                Pet.owner_id == tenant_user_id,
                Pet.is_active == True
            ).first()

            if not pet:
                return None

            # Update fields that are provided
            update_data = pet_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(pet, field, value)

            pet.updated_at = datetime.utcnow()
            session.commit()
            session.refresh(pet)
            return pet
        finally:
            session.close()

    def delete_pet(self, pet_id: int, owner_id: int) -> bool:
        """
        Delete a pet (soft delete).

        Args:
            pet_id: Pet ID
            owner_id: Owner ID (shared user ID, for authorization)

        Returns:
            bool: True if deleted, False if not found
        """
        session = self._get_session()
        try:
            self._set_search_path(session)

            # Map shared user ID to tenant user ID
            tenant_user_id = self._get_tenant_user_id(owner_id)

            pet = session.query(Pet).filter(
                Pet.id == pet_id,
                Pet.owner_id == tenant_user_id,
                Pet.is_active == True
            ).first()

            if not pet:
                return False

            pet.is_active = False
            pet.updated_at = datetime.utcnow()
            session.commit()
            return True
        finally:
            session.close()

    def search_pets(self, query: str, skip: int = 0, limit: int = 100) -> List[Pet]:
        """
        Search pets by name, breed, or description.

        Args:
            query: Search query
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List[Pet]: List of matching pets
        """
        session = self._get_session()
        try:
            self._set_search_path(session)
            search_term = f"%{query}%"
            return (
                session.query(Pet)
                .filter(
                    Pet.is_active == True,
                    (
                        Pet.name.ilike(search_term) |
                        Pet.breed.ilike(search_term) |
                        Pet.description.ilike(search_term)
                    )
                )
                .offset(skip)
                .limit(limit)
                .all()
            )
        finally:
            session.close()