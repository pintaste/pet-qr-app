"""
Pet management API endpoints.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query

from ...core.dependencies import get_current_user
from ...models.shared import User
from ...schemas.pet import PetCreate, PetUpdate, PetResponse, PetPublicResponse
from ...services.pet import PetService


router = APIRouter()


def get_pet_service() -> PetService:
    """Get pet service instance."""
    # TODO: Get tenant schema from request context
    return PetService(tenant_schema="tenant_demo")


@router.post("/", response_model=PetResponse)
async def create_pet(
    pet_data: PetCreate,
    current_user: User = Depends(get_current_user),
    pet_service: PetService = Depends(get_pet_service),
):
    """
    Create a new pet.

    Args:
        pet_data: Pet creation data
        current_user: Current authenticated user
        pet_service: Pet service instance

    Returns:
        PetResponse: Created pet data

    Raises:
        HTTPException: If creation fails
    """
    try:
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
    pet_service: PetService = Depends(get_pet_service),
):
    """
    Get pets for the current user.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        current_user: Current authenticated user
        pet_service: Pet service instance

    Returns:
        List[PetResponse]: List of pets
    """
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
    pet_service: PetService = Depends(get_pet_service),
):
    """
    Search pets by name, breed, or description.

    Args:
        q: Search query
        skip: Number of records to skip
        limit: Maximum number of records to return
        current_user: Current authenticated user
        pet_service: Pet service instance

    Returns:
        List[PetResponse]: List of matching pets
    """
    pets = pet_service.search_pets(query=q, skip=skip, limit=limit)
    return [PetResponse.from_orm(pet) for pet in pets]


@router.get("/{pet_id}", response_model=PetResponse)
async def get_pet(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    pet_service: PetService = Depends(get_pet_service),
):
    """
    Get a specific pet by ID.

    Args:
        pet_id: Pet ID
        current_user: Current authenticated user
        pet_service: Pet service instance

    Returns:
        PetResponse: Pet data

    Raises:
        HTTPException: If pet not found
    """
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
    pet_service: PetService = Depends(get_pet_service),
):
    """
    Update a pet.

    Args:
        pet_id: Pet ID
        pet_data: Pet update data
        current_user: Current authenticated user
        pet_service: Pet service instance

    Returns:
        PetResponse: Updated pet data

    Raises:
        HTTPException: If pet not found or update fails
    """
    pet = pet_service.update_pet(pet_id, pet_data, owner_id=current_user.id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found or not authorized")

    return PetResponse.from_orm(pet)


@router.delete("/{pet_id}")
async def delete_pet(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    pet_service: PetService = Depends(get_pet_service),
):
    """
    Delete a pet (soft delete).

    Args:
        pet_id: Pet ID
        current_user: Current authenticated user
        pet_service: Pet service instance

    Returns:
        dict: Success message

    Raises:
        HTTPException: If pet not found or deletion fails
    """
    success = pet_service.delete_pet(pet_id, owner_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Pet not found or not authorized")

    return {"message": "Pet deleted successfully"}


@router.get("/public/{pet_id}", response_model=PetPublicResponse)
async def get_public_pet_info(
    pet_id: int, pet_service: PetService = Depends(get_pet_service)
):
    """
    Get public pet information (no authentication required).

    This endpoint provides basic pet information that can be safely shared
    publicly, such as through QR codes or direct links.

    Args:
        pet_id: Pet ID
        pet_service: Pet service instance

    Returns:
        PetPublicResponse: Public pet information

    Raises:
        HTTPException: If pet not found
    """
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
        personality_traits=[],  # Could be extracted from description in future
        profile_photo_url=pet.photos[0] if pet.photos else None,
        photo_urls=pet.photos,
        basic_medical_info=pet.medical_info,
        emergency_contact=pet.medical_info.get("emergency_contact", {})
        if pet.medical_info
        else {},
        is_lost=False,  # TODO: Add lost status to Pet model
        last_known_location=None,
    )


@router.post("/{pet_id}/photos")
async def upload_pet_photo(pet_id: int):
    """Upload pet photo."""
    return {"message": f"Upload photo for pet {pet_id} endpoint - to be implemented"}
