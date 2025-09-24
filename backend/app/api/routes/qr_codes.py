"""
QR Code management API endpoints.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from ...core.dependencies import get_current_user
from ...models.shared import User
from ...models.tenant import Pet, QRCode
from ...schemas.pet import (
    QRCodeCreate, QRCodeUpdate, QRCodeResponse, QRCodePublicResponse,
    QRCodeVerifyRequest, QRCodeVerifyResponse, BatchQRCodeGenerate,
    BatchQRCodeResponse, PetPublicResponse
)
from ...services.qr_code import QRCodeService
from ...services.pet import PetService
from ...services.qr_image import QRImageService


router = APIRouter()


def get_qr_service() -> QRCodeService:
    """Get QR code service instance."""
    # TODO: Get tenant schema from request context
    return QRCodeService(tenant_schema="demo")


def get_pet_service() -> PetService:
    """Get pet service instance."""
    # TODO: Get tenant schema from request context
    return PetService(tenant_schema="demo")


def get_qr_image_service() -> QRImageService:
    """Get QR image service instance."""
    return QRImageService()


@router.post("/", response_model=QRCodeResponse)
async def create_qr_code(
    qr_data: QRCodeCreate,
    current_user: User = Depends(get_current_user),
    qr_service: QRCodeService = Depends(get_qr_service)
):
    """
    Create a new QR code.

    Args:
        qr_data: QR code creation data
        current_user: Current authenticated user
        qr_service: QR code service instance

    Returns:
        QRCodeResponse: Created QR code data
    """
    try:
        qr_code = qr_service.create_qr_code(qr_data, owner_id=current_user.id)
        return QRCodeResponse.from_orm(qr_code)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create QR code: {str(e)}")


@router.get("/", response_model=List[QRCodeResponse])
async def get_qr_codes(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    unassigned_only: bool = Query(False, description="Return only unassigned QR codes"),
    current_user: User = Depends(get_current_user),
    qr_service: QRCodeService = Depends(get_qr_service)
):
    """
    Get QR codes for the current tenant.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        unassigned_only: Return only unassigned QR codes
        current_user: Current authenticated user
        qr_service: QR code service instance

    Returns:
        List[QRCodeResponse]: List of QR codes
    """
    if unassigned_only:
        qr_codes = qr_service.get_unassigned_qr_codes(skip=skip, limit=limit)
    else:
        # For now, return unassigned codes - in production, filter by user/tenant
        qr_codes = qr_service.get_unassigned_qr_codes(skip=skip, limit=limit)

    return [QRCodeResponse.from_orm(qr_code) for qr_code in qr_codes]


@router.get("/{qr_code}", response_model=QRCodePublicResponse)
async def get_qr_info(
    qr_code: str,
    qr_service: QRCodeService = Depends(get_qr_service)
):
    """
    Get QR code information (public endpoint).

    Args:
        qr_code: QR code string
        qr_service: QR code service instance

    Returns:
        QRCodePublicResponse: Public QR code information
    """
    qr_obj = qr_service.get_qr_code_by_code(qr_code)
    if not qr_obj:
        raise HTTPException(status_code=404, detail="QR code not found")

    return QRCodePublicResponse(
        code=qr_obj.code,
        is_active=qr_obj.status.value == "active",
        is_assigned=qr_obj.pet_id is not None,
        requires_pin=True,
        pet_info=None  # Don't show pet info until PIN is verified
    )


@router.post("/verify", response_model=QRCodeVerifyResponse)
async def verify_qr_pin(
    request: QRCodeVerifyRequest,
    qr_service: QRCodeService = Depends(get_qr_service),
    pet_service: PetService = Depends(get_pet_service)
):
    """
    Verify PIN for QR code and return pet information.

    Args:
        request: QR code verification request
        qr_service: QR code service instance
        pet_service: Pet service instance

    Returns:
        QRCodeVerifyResponse: Verification result with pet info
    """
    # Verify PIN
    if not qr_service.verify_qr_code_pin(request.qr_code, request.pin):
        return QRCodeVerifyResponse(
            success=False,
            message="Invalid PIN code",
            pet_info=None
        )

    # Get QR code and pet information
    qr_obj = qr_service.get_qr_code_by_code(request.qr_code)
    if not qr_obj or not qr_obj.pet_id:
        return QRCodeVerifyResponse(
            success=False,
            message="QR code not assigned to a pet",
            pet_info=None
        )

    # Get pet information
    pet = pet_service.get_pet(qr_obj.pet_id)
    if not pet:
        return QRCodeVerifyResponse(
            success=False,
            message="Pet not found",
            pet_info=None
        )

    # Create public pet response
    pet_info = PetPublicResponse(
        name=pet.name,
        breed=pet.breed,
        age=pet.age,
        sex=pet.sex,
        size=pet.size,
        color=pet.color,
        description=pet.description,
        personality_traits=[],  # Could be extracted from description
        profile_photo_url=pet.photos[0] if pet.photos else None,
        photo_urls=pet.photos,
        basic_medical_info=pet.medical_info,
        emergency_contact=pet.medical_info.get("emergency_contact", {}) if pet.medical_info else {},
        is_lost=False,  # TODO: Add lost status to Pet model
        last_known_location=None
    )

    return QRCodeVerifyResponse(
        success=True,
        status="verified",
        message="PIN verified successfully",
        pet_id=pet.id,
        pet_info=pet_info
    )


@router.post("/{qr_id}/assign/{pet_id}", response_model=QRCodeResponse)
async def assign_qr_code_to_pet(
    qr_id: int,
    pet_id: int,
    current_user: User = Depends(get_current_user),
    qr_service: QRCodeService = Depends(get_qr_service),
    pet_service: PetService = Depends(get_pet_service)
):
    """
    Assign a QR code to a pet.

    Args:
        qr_id: QR code ID
        pet_id: Pet ID
        current_user: Current authenticated user
        qr_service: QR code service instance
        pet_service: Pet service instance

    Returns:
        QRCodeResponse: Updated QR code
    """
    # Verify pet ownership
    pet = pet_service.get_pet(pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    # For now, skip ownership check - in production, verify user owns pet

    # Assign QR code
    qr_code = qr_service.assign_qr_code_to_pet(qr_id, pet_id)
    if not qr_code:
        raise HTTPException(status_code=404, detail="QR code not found")

    return QRCodeResponse.from_orm(qr_code)


@router.post("/{qr_code}/activate", response_model=QRCodeResponse)
async def activate_qr_code_with_pet(
    qr_code: str,
    pet_id: int = Query(..., description="Pet ID to associate with QR code"),
    current_user: User = Depends(get_current_user),
    qr_service: QRCodeService = Depends(get_qr_service),
    pet_service: PetService = Depends(get_pet_service)
):
    """
    Activate QR code and associate with a pet.

    Args:
        qr_code: QR code string
        pet_id: Pet ID to associate
        current_user: Current authenticated user
        qr_service: QR code service instance
        pet_service: Pet service instance

    Returns:
        QRCodeResponse: Activated QR code
    """
    # Verify pet exists
    pet = pet_service.get_pet(pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    # Activate QR code
    qr_obj = qr_service.activate_qr_code(qr_code, pet_id)
    if not qr_obj:
        raise HTTPException(status_code=404, detail="QR code not found or already active")

    return QRCodeResponse.from_orm(qr_obj)


@router.put("/{qr_id}", response_model=QRCodeResponse)
async def update_qr_code(
    qr_id: int,
    qr_data: QRCodeUpdate,
    current_user: User = Depends(get_current_user),
    qr_service: QRCodeService = Depends(get_qr_service)
):
    """
    Update a QR code.

    Args:
        qr_id: QR code ID
        qr_data: QR code update data
        current_user: Current authenticated user
        qr_service: QR code service instance

    Returns:
        QRCodeResponse: Updated QR code
    """
    qr_code = qr_service.update_qr_code(qr_id, qr_data)
    if not qr_code:
        raise HTTPException(status_code=404, detail="QR code not found")

    return QRCodeResponse.from_orm(qr_code)


@router.post("/batch/generate", response_model=BatchQRCodeResponse)
async def generate_batch_qr_codes(
    batch_data: BatchQRCodeGenerate,
    current_user: User = Depends(get_current_user),
    qr_service: QRCodeService = Depends(get_qr_service)
):
    """
    Generate a batch of QR codes.

    Args:
        batch_data: Batch generation data
        current_user: Current authenticated user
        qr_service: QR code service instance

    Returns:
        BatchQRCodeResponse: Generated QR codes batch
    """
    try:
        qr_codes = qr_service.generate_batch_qr_codes(
            quantity=batch_data.quantity,
            batch_id=batch_data.batch_id,
            physical_format=batch_data.physical_format
        )

        return BatchQRCodeResponse(
            batch_id=qr_codes[0].batch_id,
            quantity=len(qr_codes),
            qr_codes=[QRCodeResponse.from_orm(qr_code) for qr_code in qr_codes],
            created_at=qr_codes[0].created_at
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate batch: {str(e)}")


@router.get("/pet/{pet_id}", response_model=List[QRCodeResponse])
async def get_pet_qr_codes(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    qr_service: QRCodeService = Depends(get_qr_service),
    pet_service: PetService = Depends(get_pet_service)
):
    """
    Get QR codes associated with a specific pet.

    Args:
        pet_id: Pet ID
        current_user: Current authenticated user
        qr_service: QR code service instance
        pet_service: Pet service instance

    Returns:
        List[QRCodeResponse]: List of QR codes for the pet
    """
    # Verify pet exists
    pet = pet_service.get_pet(pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    # Get QR codes for the pet
    qr_codes = qr_service.get_qr_codes_by_pet(pet_id)
    return [QRCodeResponse.from_orm(qr_code) for qr_code in qr_codes]


@router.post("/{qr_code}/scan")
async def record_scan(
    qr_code: str,
    qr_service: QRCodeService = Depends(get_qr_service)
):
    """
    Record QR code scan event.

    Args:
        qr_code: QR code string
        qr_service: QR code service instance

    Returns:
        dict: Scan recorded confirmation
    """
    # Verify QR code exists
    qr_obj = qr_service.get_qr_code_by_code(qr_code)
    if not qr_obj:
        raise HTTPException(status_code=404, detail="QR code not found")

    # TODO: Implement scan logging
    # This would create a scan event record with IP, timestamp, etc.

    return {"message": "Scan recorded successfully", "qr_code": qr_code}


@router.get("/{qr_code}/image")
async def get_qr_code_image(
    qr_code: str,
    format: str = Query("png", description="Image format (png, jpg)"),
    size: int = Query(300, description="Image size in pixels"),
    qr_service: QRCodeService = Depends(get_qr_service),
    pet_service: PetService = Depends(get_pet_service),
    qr_image_service: QRImageService = Depends(get_qr_image_service)
):
    """
    Get QR code image.

    Args:
        qr_code: QR code string
        format: Image format
        size: Image size in pixels
        qr_service: QR code service instance
        pet_service: Pet service instance
        qr_image_service: QR image service instance

    Returns:
        Response: QR code image
    """
    # Verify QR code exists
    qr_obj = qr_service.get_qr_code_by_code(qr_code)
    if not qr_obj:
        raise HTTPException(status_code=404, detail="QR code not found")

    # Get pet name if assigned
    pet_name = None
    if qr_obj.pet_id:
        pet = pet_service.get_pet(qr_obj.pet_id)
        if pet:
            pet_name = pet.name

    # Generate the landing URL
    landing_url = "http://localhost:8000/scan"  # TODO: Make this configurable

    # Generate QR image
    try:
        image_bytes = qr_image_service.generate_pet_qr_image(
            qr_code=qr_code,
            landing_url=landing_url,
            pin=qr_obj.pin,
            pet_name=pet_name,
            size=size
        )

        media_type = "image/png" if format.lower() == "png" else "image/jpeg"
        return Response(content=image_bytes, media_type=media_type)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate QR image: {str(e)}")


@router.get("/{qr_id}/download")
async def download_qr_code(
    qr_id: int,
    format: str = Query("png", description="Image format (png, jpg)"),
    size: int = Query(400, description="Image size in pixels"),
    current_user: User = Depends(get_current_user),
    qr_service: QRCodeService = Depends(get_qr_service),
    pet_service: PetService = Depends(get_pet_service),
    qr_image_service: QRImageService = Depends(get_qr_image_service)
):
    """
    Download QR code image (authenticated).

    Args:
        qr_id: QR code ID
        format: Image format
        size: Image size in pixels
        current_user: Current authenticated user
        qr_service: QR code service instance
        pet_service: Pet service instance
        qr_image_service: QR image service instance

    Returns:
        Response: QR code image for download
    """
    # Get QR code
    qr_obj = qr_service.get_qr_code(qr_id)
    if not qr_obj:
        raise HTTPException(status_code=404, detail="QR code not found")

    # Get pet name if assigned
    pet_name = None
    if qr_obj.pet_id:
        pet = pet_service.get_pet(qr_obj.pet_id)
        if pet:
            pet_name = pet.name

    # Generate the landing URL
    landing_url = "http://localhost:8000/scan"  # TODO: Make this configurable

    # Generate QR image
    try:
        image_bytes = qr_image_service.generate_pet_qr_image(
            qr_code=qr_obj.code,
            landing_url=landing_url,
            pin=qr_obj.pin,
            pet_name=pet_name,
            size=size
        )

        media_type = "image/png" if format.lower() == "png" else "image/jpeg"
        filename = f"qr_code_{qr_obj.code}.{format.lower()}"

        return Response(
            content=image_bytes,
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate QR image: {str(e)}")