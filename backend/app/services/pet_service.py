"""
Pet management service with tenant isolation.
"""

from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status, UploadFile
from sqlmodel import Session, select
from app.models.tenant import Pet, TenantUser
from app.models.shared import Tenant
from app.services.tenant_service import tenant_service
import json
from datetime import datetime


class PetService:
    """
    Pet management service with tenant-aware operations.
    """

    def __init__(self):
        """Initialize pet service."""
        pass

    async def ensure_tenant_context(
        self,
        db: Session,
        tenant: Tenant
    ) -> None:
        """
        Ensure database context is set to tenant schema.

        Args:
            db (Session): Database session.
            tenant (Tenant): Tenant to switch context to.
        """
        await tenant_service.switch_tenant_context(db, tenant)

    def validate_pet_data(self, pet_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate and sanitize pet data.

        Args:
            pet_data (Dict[str, Any]): Pet data to validate.

        Returns:
            Dict[str, Any]: Validated pet data.

        Raises:
            HTTPException: If validation fails.
        """
        required_fields = ["name", "breed"]
        for field in required_fields:
            if not pet_data.get(field):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Field '{field}' is required"
                )

        # Validate age
        age_months = pet_data.get("age_months", 0)
        if age_months < 0 or age_months > 300:  # Max ~25 years
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Age must be between 0 and 300 months"
            )

        # Validate photos list
        photos = pet_data.get("photos", [])
        if not isinstance(photos, list):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Photos must be a list"
            )

        # Limit photo count
        if len(photos) > 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 10 photos allowed"
            )

        # Validate medical info
        medical_info = pet_data.get("medical_info", {})
        if not isinstance(medical_info, dict):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Medical info must be an object"
            )

        # Validate contact info
        contact_info = pet_data.get("contact_info", {})
        if not isinstance(contact_info, dict):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contact info must be an object"
            )

        return pet_data

    async def create_pet(
        self,
        db: Session,
        tenant: Tenant,
        pet_data: Dict[str, Any],
        owner_id: int
    ) -> Pet:
        """
        Create a new pet with tenant isolation.

        Args:
            db (Session): Database session.
            tenant (Tenant): Current tenant.
            pet_data (Dict[str, Any]): Pet data.
            owner_id (int): Owner (TenantUser) ID.

        Returns:
            Pet: Created pet object.

        Raises:
            HTTPException: If creation fails.
        """
        # Ensure tenant context
        await self.ensure_tenant_context(db, tenant)

        # Validate pet data
        validated_data = self.validate_pet_data(pet_data)

        # Verify owner exists in tenant
        owner = db.exec(
            select(TenantUser)
            .where(TenantUser.id == owner_id)
            .where(TenantUser.tenant_id == tenant.id)
        ).first()

        if not owner:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Owner not found in this tenant"
            )

        try:
            # Create pet
            pet = Pet(
                name=validated_data["name"],
                breed=validated_data["breed"],
                age_months=validated_data.get("age_months", 0),
                description=validated_data.get("description", ""),
                photos=validated_data.get("photos", []),
                medical_info=validated_data.get("medical_info", {}),
                contact_info=validated_data.get("contact_info", {}),
                owner_id=owner_id,
                tenant_id=tenant.id
            )

            db.add(pet)
            db.commit()
            db.refresh(pet)

            return pet

        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create pet: {str(e)}"
            )

    async def get_pet(
        self,
        db: Session,
        tenant: Tenant,
        pet_id: int
    ) -> Optional[Pet]:
        """
        Get pet by ID with tenant isolation.

        Args:
            db (Session): Database session.
            tenant (Tenant): Current tenant.
            pet_id (int): Pet ID.

        Returns:
            Optional[Pet]: Pet object if found.
        """
        # Ensure tenant context
        await self.ensure_tenant_context(db, tenant)

        pet = db.exec(
            select(Pet)
            .where(Pet.id == pet_id)
            .where(Pet.tenant_id == tenant.id)
        ).first()

        return pet

    async def get_pets_by_owner(
        self,
        db: Session,
        tenant: Tenant,
        owner_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Pet]:
        """
        Get pets owned by a specific owner with tenant isolation.

        Args:
            db (Session): Database session.
            tenant (Tenant): Current tenant.
            owner_id (int): Owner ID.
            skip (int): Number of records to skip.
            limit (int): Maximum number of records to return.

        Returns:
            List[Pet]: List of pets.
        """
        # Ensure tenant context
        await self.ensure_tenant_context(db, tenant)

        pets = db.exec(
            select(Pet)
            .where(Pet.owner_id == owner_id)
            .where(Pet.tenant_id == tenant.id)
            .offset(skip)
            .limit(limit)
        ).all()

        return list(pets)

    async def get_all_pets(
        self,
        db: Session,
        tenant: Tenant,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None
    ) -> List[Pet]:
        """
        Get all pets in tenant with optional search.

        Args:
            db (Session): Database session.
            tenant (Tenant): Current tenant.
            skip (int): Number of records to skip.
            limit (int): Maximum number of records to return.
            search (Optional[str]): Search term for name or breed.

        Returns:
            List[Pet]: List of pets.
        """
        # Ensure tenant context
        await self.ensure_tenant_context(db, tenant)

        query = select(Pet).where(Pet.tenant_id == tenant.id)

        # Add search filter
        if search:
            search_term = f"%{search.lower()}%"
            query = query.where(
                (Pet.name.ilike(search_term)) |
                (Pet.breed.ilike(search_term))
            )

        pets = db.exec(
            query.offset(skip).limit(limit)
        ).all()

        return list(pets)

    async def update_pet(
        self,
        db: Session,
        tenant: Tenant,
        pet_id: int,
        pet_data: Dict[str, Any],
        owner_id: Optional[int] = None
    ) -> Pet:
        """
        Update pet with tenant isolation.

        Args:
            db (Session): Database session.
            tenant (Tenant): Current tenant.
            pet_id (int): Pet ID to update.
            pet_data (Dict[str, Any]): Updated pet data.
            owner_id (Optional[int]): Owner ID for ownership validation.

        Returns:
            Pet: Updated pet object.

        Raises:
            HTTPException: If update fails.
        """
        # Ensure tenant context
        await self.ensure_tenant_context(db, tenant)

        # Get existing pet
        pet = await self.get_pet(db, tenant, pet_id)
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found"
            )

        # Validate ownership if owner_id provided
        if owner_id and pet.owner_id != owner_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this pet"
            )

        # Validate updated data
        validated_data = self.validate_pet_data(pet_data)

        try:
            # Update pet fields
            for field, value in validated_data.items():
                if hasattr(pet, field):
                    setattr(pet, field, value)

            pet.updated_at = datetime.utcnow()

            db.add(pet)
            db.commit()
            db.refresh(pet)

            return pet

        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update pet: {str(e)}"
            )

    async def delete_pet(
        self,
        db: Session,
        tenant: Tenant,
        pet_id: int,
        owner_id: Optional[int] = None
    ) -> bool:
        """
        Delete pet with tenant isolation.

        Args:
            db (Session): Database session.
            tenant (Tenant): Current tenant.
            pet_id (int): Pet ID to delete.
            owner_id (Optional[int]): Owner ID for ownership validation.

        Returns:
            bool: True if deletion successful.

        Raises:
            HTTPException: If deletion fails.
        """
        # Ensure tenant context
        await self.ensure_tenant_context(db, tenant)

        # Get existing pet
        pet = await self.get_pet(db, tenant, pet_id)
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found"
            )

        # Validate ownership if owner_id provided
        if owner_id and pet.owner_id != owner_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this pet"
            )

        try:
            # Check if pet is associated with QR codes
            from app.models.tenant import QRCode
            qr_codes = db.exec(
                select(QRCode).where(QRCode.pet_id == pet_id)
            ).all()

            # Unlink QR codes before deletion
            for qr_code in qr_codes:
                qr_code.pet_id = None
                qr_code.status = "inactive"
                db.add(qr_code)

            # Delete pet
            db.delete(pet)
            db.commit()

            return True

        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete pet: {str(e)}"
            )

    async def add_pet_photo(
        self,
        db: Session,
        tenant: Tenant,
        pet_id: int,
        photo_url: str,
        owner_id: Optional[int] = None
    ) -> Pet:
        """
        Add photo to pet.

        Args:
            db (Session): Database session.
            tenant (Tenant): Current tenant.
            pet_id (int): Pet ID.
            photo_url (str): Photo URL to add.
            owner_id (Optional[int]): Owner ID for ownership validation.

        Returns:
            Pet: Updated pet object.

        Raises:
            HTTPException: If operation fails.
        """
        # Get pet
        pet = await self.get_pet(db, tenant, pet_id)
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found"
            )

        # Validate ownership
        if owner_id and pet.owner_id != owner_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this pet"
            )

        # Check photo limit
        if len(pet.photos) >= 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 10 photos allowed"
            )

        try:
            # Add photo URL
            if photo_url not in pet.photos:
                pet.photos.append(photo_url)
                pet.updated_at = datetime.utcnow()

                db.add(pet)
                db.commit()
                db.refresh(pet)

            return pet

        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to add photo: {str(e)}"
            )

    async def remove_pet_photo(
        self,
        db: Session,
        tenant: Tenant,
        pet_id: int,
        photo_url: str,
        owner_id: Optional[int] = None
    ) -> Pet:
        """
        Remove photo from pet.

        Args:
            db (Session): Database session.
            tenant (Tenant): Current tenant.
            pet_id (int): Pet ID.
            photo_url (str): Photo URL to remove.
            owner_id (Optional[int]): Owner ID for ownership validation.

        Returns:
            Pet: Updated pet object.

        Raises:
            HTTPException: If operation fails.
        """
        # Get pet
        pet = await self.get_pet(db, tenant, pet_id)
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found"
            )

        # Validate ownership
        if owner_id and pet.owner_id != owner_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this pet"
            )

        try:
            # Remove photo URL
            if photo_url in pet.photos:
                pet.photos.remove(photo_url)
                pet.updated_at = datetime.utcnow()

                db.add(pet)
                db.commit()
                db.refresh(pet)

            return pet

        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to remove photo: {str(e)}"
            )

    async def get_pet_statistics(
        self,
        db: Session,
        tenant: Tenant
    ) -> Dict[str, Any]:
        """
        Get pet statistics for tenant.

        Args:
            db (Session): Database session.
            tenant (Tenant): Current tenant.

        Returns:
            Dict[str, Any]: Pet statistics.
        """
        # Ensure tenant context
        await self.ensure_tenant_context(db, tenant)

        try:
            from sqlalchemy import func

            # Total pets
            total_pets = db.exec(
                select(func.count(Pet.id)).where(Pet.tenant_id == tenant.id)
            ).first()

            # Pets with QR codes
            pets_with_qr = db.exec(
                select(func.count(Pet.id))
                .where(Pet.tenant_id == tenant.id)
                .where(Pet.qr_code_id.isnot(None))
            ).first()

            # Most common breeds
            breed_stats = db.exec(
                select(Pet.breed, func.count(Pet.id).label('count'))
                .where(Pet.tenant_id == tenant.id)
                .group_by(Pet.breed)
                .order_by(func.count(Pet.id).desc())
                .limit(5)
            ).all()

            return {
                "total_pets": total_pets or 0,
                "pets_with_qr_codes": pets_with_qr or 0,
                "most_common_breeds": [
                    {"breed": breed, "count": count}
                    for breed, count in breed_stats
                ]
            }

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get statistics: {str(e)}"
            )


# Global pet service instance
pet_service = PetService()