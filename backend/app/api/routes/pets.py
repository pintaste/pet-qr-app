"""
Pet management API endpoints.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from ...core.dependencies import get_current_user, get_db
from ...models.shared import User, Tenant
from ...schemas.pet import PetCreate, PetUpdate, PetResponse, PetPublicResponse
from ...services.pet import PetService


router = APIRouter()


def get_tenant_schema_for_user(db: Session, user: User) -> str:
    """
    Get the tenant schema name for a user based on their tenant_id.

    Args:
        db: Database session
        user: User object

    Returns:
        str: Schema name
    """
    if user.tenant_id:
        tenant = db.exec(select(Tenant).where(Tenant.id == user.tenant_id)).first()
        if tenant:
            return f"tenant_{tenant.subdomain.replace('-', '_')}"
    return "tenant_demo"


@router.post("/", response_model=PetResponse)
async def create_pet(
    pet_data: PetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new pet.

    Args:
        pet_data: Pet creation data
        current_user: Current authenticated user
        db: Database session

    Returns:
        PetResponse: Created pet data

    Raises:
        HTTPException: If creation fails
    """
    try:
        tenant_schema = get_tenant_schema_for_user(db, current_user)
        pet_service = PetService(tenant_schema=tenant_schema)
        pet = pet_service.create_pet(pet_data, owner_id=current_user.id)
        return PetResponse.from_orm(pet)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create pet: {str(e)}")


@router.get("/", response_model=List[PetResponse])
async def get_pets(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        100, ge=1, le=1000, description="Maximum number of records to return"
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get pets for the current user.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        current_user: Current authenticated user
        db: Database session

    Returns:
        List[PetResponse]: List of pets
    """
    tenant_schema = get_tenant_schema_for_user(db, current_user)
    pet_service = PetService(tenant_schema=tenant_schema)
    pets = pet_service.get_pets_by_owner(
        owner_id=current_user.id, skip=skip, limit=limit
    )
    return [PetResponse.from_orm(pet) for pet in pets]


@router.get("/search", response_model=List[PetResponse])
async def search_pets(
    q: str = Query(..., min_length=1, description="Search query"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        100, ge=1, le=1000, description="Maximum number of records to return"
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Search pets by name, breed, or description.

    Args:
        q: Search query
        skip: Number of records to skip
        limit: Maximum number of records to return
        current_user: Current authenticated user
        db: Database session

    Returns:
        List[PetResponse]: List of matching pets
    """
    tenant_schema = get_tenant_schema_for_user(db, current_user)
    pet_service = PetService(tenant_schema=tenant_schema)
    pets = pet_service.search_pets(query=q, skip=skip, limit=limit)
    return [PetResponse.from_orm(pet) for pet in pets]


@router.get("/{pet_id}", response_model=PetResponse)
async def get_pet(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a specific pet by ID.

    Args:
        pet_id: Pet ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        PetResponse: Pet data

    Raises:
        HTTPException: If pet not found
    """
    tenant_schema = get_tenant_schema_for_user(db, current_user)
    pet_service = PetService(tenant_schema=tenant_schema)
    pet = pet_service.get_pet(pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    # Check if user owns this pet
    if pet.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this pet")

    return PetResponse.from_orm(pet)


@router.put("/{pet_id}", response_model=PetResponse)
async def update_pet(
    pet_id: int,
    pet_data: PetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update a pet.

    Args:
        pet_id: Pet ID
        pet_data: Pet update data
        current_user: Current authenticated user
        db: Database session

    Returns:
        PetResponse: Updated pet data

    Raises:
        HTTPException: If pet not found or update fails
    """
    tenant_schema = get_tenant_schema_for_user(db, current_user)
    pet_service = PetService(tenant_schema=tenant_schema)
    pet = pet_service.update_pet(pet_id, pet_data, owner_id=current_user.id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found or not authorized")

    return PetResponse.from_orm(pet)


@router.delete("/{pet_id}")
async def delete_pet(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a pet (soft delete).

    Args:
        pet_id: Pet ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        dict: Success message

    Raises:
        HTTPException: If pet not found or deletion fails
    """
    tenant_schema = get_tenant_schema_for_user(db, current_user)
    pet_service = PetService(tenant_schema=tenant_schema)
    success = pet_service.delete_pet(pet_id, owner_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Pet not found or not authorized")

    return {"message": "Pet deleted successfully"}


@router.get("/public/{pet_id}", response_model=PetPublicResponse)
async def get_public_pet_info(pet_id: int, db: Session = Depends(get_db)):
    """
    Get public pet information (no authentication required).

    This endpoint provides basic pet information that can be safely shared
    publicly, such as through QR codes or direct links.

    Args:
        pet_id: Pet ID
        db: Database session

    Returns:
        PetPublicResponse: Public pet information

    Raises:
        HTTPException: If pet not found
    """
    # For public endpoint, use tenant_demo as default
    pet_service = PetService(tenant_schema="tenant_demo")
    pet = pet_service.get_pet(pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    # Create public pet response with filtered information
    return PetPublicResponse(
        name=pet.name,
        breed=pet.breed,
        age=pet.age,
        sex=pet.sex,
        size=pet.size,
        color=pet.color,
        description=pet.description,
        personality_traits=[],
        profile_photo_url=pet.photos[0] if pet.photos else None,
        photo_urls=pet.photos,
        basic_medical_info=pet.medical_info,
        emergency_contact=pet.medical_info.get("emergency_contact", {})
        if pet.medical_info
        else {},
        is_lost=False,
        last_known_location=None,
    )


@router.post("/{pet_id}/toggle-pin", response_model=PetResponse)
async def toggle_pin_pet(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Toggle pin status for a pet.

    Pinned pets will be displayed at the front of the pet list.

    Args:
        pet_id: Pet ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        PetResponse: Updated pet data with new pin status

    Raises:
        HTTPException: If pet not found or not authorized
    """
    tenant_schema = get_tenant_schema_for_user(db, current_user)
    pet_service = PetService(tenant_schema=tenant_schema)
    updated_pet = pet_service.toggle_pin(pet_id, owner_id=current_user.id)
    if not updated_pet:
        raise HTTPException(status_code=404, detail="Pet not found or not authorized")

    return PetResponse.from_orm(updated_pet)


@router.post("/{pet_id}/link-qr", response_model=PetResponse)
async def link_qr_to_pet(
    pet_id: int,
    qr_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Link a QR code to a pet.

    Args:
        pet_id: Pet ID
        qr_data: Dictionary containing qr_code_id
        current_user: Current authenticated user
        db: Database session

    Returns:
        PetResponse: Updated pet data with QR code linked

    Raises:
        HTTPException: If pet not found, not authorized, or QR code already assigned
    """
    qr_code_id = qr_data.get('qr_code_id')
    if not qr_code_id:
        raise HTTPException(status_code=400, detail="qr_code_id is required")

    tenant_schema = get_tenant_schema_for_user(db, current_user)
    pet_service = PetService(tenant_schema=tenant_schema)
    updated_pet = pet_service.link_qr_code(pet_id, qr_code_id, owner_id=current_user.id)
    if not updated_pet:
        raise HTTPException(status_code=404, detail="Pet not found or not authorized")

    return PetResponse.from_orm(updated_pet)


@router.post("/{pet_id}/unlink-qr", response_model=PetResponse)
async def unlink_qr_from_pet(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Unlink QR code from a pet.

    Args:
        pet_id: Pet ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        PetResponse: Updated pet data with QR code unlinked

    Raises:
        HTTPException: If pet not found or not authorized
    """
    tenant_schema = get_tenant_schema_for_user(db, current_user)
    pet_service = PetService(tenant_schema=tenant_schema)
    updated_pet = pet_service.unlink_qr_code(pet_id, owner_id=current_user.id)
    if not updated_pet:
        raise HTTPException(status_code=404, detail="Pet not found or not authorized")

    return PetResponse.from_orm(updated_pet)


@router.post("/{pet_id}/photos")
async def upload_pet_photo(pet_id: int):
    """Upload pet photo."""
    return {"message": f"Upload photo for pet {pet_id} endpoint - to be implemented"}
