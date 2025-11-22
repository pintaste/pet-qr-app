"""
QR Code management API endpoints.
"""

import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from fastapi.responses import Response
from pydantic import BaseModel

from sqlmodel import Session, select

from ...core.dependencies import get_current_user, get_db
from ...models.shared import User, UserRole, Tenant
from ...schemas.pet import (
    QRCodeCreate,
    QRCodeUpdate,
    QRCodeResponse,
    QRCodePublicResponse,
    QRCodeVerifyRequest,
    QRCodeVerifyResponse,
    BatchQRCodeGenerate,
    BatchQRCodeResponse,
    PetPublicResponse,
)
from ...services.qr_code import QRCodeService
from ...services.pet import PetService
from ...services.qr_image import QRImageService
from ...services.task_manager import task_manager, TaskStatus


def get_tenant_schema_for_user(db: Session, user: User) -> str:
    """
    Get the schema name for a user's tenant.

    Args:
        db: Database session
        user: Current user

    Returns:
        Schema name string
    """
    if user.tenant_id:
        tenant = db.exec(select(Tenant).where(Tenant.id == user.tenant_id)).first()
        if tenant:
            # Replace hyphens with underscores for valid PostgreSQL schema names
            return f"tenant_{tenant.subdomain.replace('-', '_')}"
    return "tenant_demo"


class BulkDeleteRequest(BaseModel):
    """Request model for bulk delete operation."""
    qr_ids: List[int]


class BatchGenerateRequest(BaseModel):
    """Request model for batch QR code generation with background processing."""
    quantity: int
    batch_id: Optional[str] = None
    physical_format: str = "sticker"
    assigned_to_tenant_id: Optional[int] = None


class QRActivationRequest(BaseModel):
    """Request model for QR code activation."""
    qr_code: str
    pin: str


router = APIRouter()


def get_qr_service() -> QRCodeService:
    """Get QR code service instance."""
    # TODO: Get tenant schema from request context
    return QRCodeService(tenant_schema="tenant_demo")


def get_pet_service() -> PetService:
    """Get pet service instance."""
    # TODO: Get tenant schema from request context
    return PetService(tenant_schema="tenant_demo")


def get_qr_image_service() -> QRImageService:
    """Get QR image service instance."""
    return QRImageService()


@router.post("/", response_model=QRCodeResponse)
async def create_qr_code(
    qr_data: QRCodeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new QR code.

    Args:
        qr_data: QR code creation data
        current_user: Current authenticated user
        db: Database session

    Returns:
        QRCodeResponse: Created QR code data
    """
    try:
        tenant_schema = get_tenant_schema_for_user(db, current_user)
        qr_service = QRCodeService(tenant_schema=tenant_schema)
        qr_code = qr_service.create_qr_code(qr_data, owner_id=current_user.id)
        return QRCodeResponse.from_orm(qr_code)
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to create QR code: {str(e)}"
        )


@router.get("/available", response_model=List[QRCodeResponse])
async def get_available_qr_codes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get available (unassigned) QR codes for the current user.

    Args:
        current_user: Current authenticated user
        db: Database session

    Returns:
        List[QRCodeResponse]: List of available QR codes
    """
    tenant_schema = get_tenant_schema_for_user(db, current_user)
    qr_service = QRCodeService(tenant_schema=tenant_schema)
    qr_codes = qr_service.get_unassigned_qr_codes(owner_id=current_user.id)
    return [QRCodeResponse.from_orm(qr) for qr in qr_codes]


@router.get("/", response_model=List[QRCodeResponse])
async def get_qr_codes(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        100, ge=1, le=1000000, description="Maximum number of records to return"
    ),
    unassigned_only: bool = Query(False, description="Return only unassigned QR codes"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get QR codes for the current user/tenant.

    For regular users: Returns QR codes linked to their pets only.
    For tenant admins and super admins: Returns all QR codes in the tenant.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        unassigned_only: Return only unassigned QR codes
        current_user: Current authenticated user
        db: Database session

    Returns:
        List[QRCodeResponse]: List of QR codes
    """
    # Get tenant schema for current user
    tenant_schema = get_tenant_schema_for_user(db, current_user)
    qr_service = QRCodeService(tenant_schema=tenant_schema)

    if unassigned_only:
        qr_codes = qr_service.get_unassigned_qr_codes(skip=skip, limit=limit)
    elif current_user.role == UserRole.USER:
        # Regular users only see QR codes linked to their own pets
        qr_codes = qr_service.get_qr_codes_by_owner(
            owner_id=current_user.id, skip=skip, limit=limit
        )
    else:
        # Admins can see all QR codes in the tenant
        qr_codes = qr_service.get_all_qr_codes(skip=skip, limit=limit)

    return [QRCodeResponse.from_orm(qr_code) for qr_code in qr_codes]


@router.get("/{qr_code}", response_model=QRCodePublicResponse)
async def get_qr_info(
    qr_code: str, qr_service: QRCodeService = Depends(get_qr_service)
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
        pet_info=None,  # Don't show pet info until PIN is verified
    )


@router.post("/verify", response_model=QRCodeVerifyResponse)
async def verify_qr_pin(
    request: QRCodeVerifyRequest,
    qr_service: QRCodeService = Depends(get_qr_service),
    pet_service: PetService = Depends(get_pet_service),
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
            success=False, message="Invalid PIN code", pet_info=None
        )

    # Get QR code and pet information
    qr_obj = qr_service.get_qr_code_by_code(request.qr_code)
    if not qr_obj or not qr_obj.pet_id:
        return QRCodeVerifyResponse(
            success=False, message="QR code not assigned to a pet", pet_info=None
        )

    # Get pet information
    pet = pet_service.get_pet(qr_obj.pet_id)
    if not pet:
        return QRCodeVerifyResponse(
            success=False, message="Pet not found", pet_info=None
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
        emergency_contact=pet.medical_info.get("emergency_contact", {})
        if pet.medical_info
        else {},
        is_lost=False,  # TODO: Add lost status to Pet model
        last_known_location=None,
    )

    return QRCodeVerifyResponse(
        success=True,
        status="verified",
        message="PIN verified successfully",
        pet_id=pet.id,
        pet_info=pet_info,
    )


@router.post("/{qr_id}/assign/{pet_id}", response_model=QRCodeResponse)
async def assign_qr_code_to_pet(
    qr_id: int,
    pet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Assign a QR code to a pet.

    Args:
        qr_id: QR code ID
        pet_id: Pet ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        QRCodeResponse: Updated QR code
    """
    tenant_schema = get_tenant_schema_for_user(db, current_user)
    qr_service = QRCodeService(tenant_schema=tenant_schema)
    pet_service = PetService(tenant_schema=tenant_schema)

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


@router.post("/activate", response_model=QRCodeResponse)
async def activate_qr_code(
    request: QRActivationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Activate a QR code by verifying PIN and claiming it for the current user.

    This endpoint allows users to activate/claim a QR code without
    immediately linking it to a pet. The QR code can be linked to a pet later.

    Args:
        request: QR activation request with code and PIN
        current_user: Current authenticated user
        db: Database session

    Returns:
        QRCodeResponse: Activated QR code
    """
    tenant_schema = get_tenant_schema_for_user(db, current_user)
    qr_service = QRCodeService(tenant_schema=tenant_schema)
    pet_service = PetService(tenant_schema=tenant_schema)

    # Get the QR code
    qr_obj = qr_service.get_qr_code_by_code(request.qr_code.upper())
    if not qr_obj:
        raise HTTPException(status_code=404, detail="QR code not found")

    # Verify PIN
    if not qr_service.verify_qr_code_pin(request.qr_code.upper(), request.pin):
        raise HTTPException(status_code=400, detail="Invalid PIN")

    # Check if already activated/assigned to a pet
    if qr_obj.pet_id:
        raise HTTPException(status_code=400, detail="QR code is already assigned to a pet")

    # Get tenant user ID for the current user
    tenant_user_id = pet_service._get_tenant_user_id(current_user.id)

    # Mark QR code as active (without pet assignment) and track activating user
    from datetime import datetime
    from ...models.tenant import QRCodeStatus

    updated_qr = qr_service.update_qr_code(
        qr_obj.id,
        QRCodeUpdate(
            status=QRCodeStatus.ACTIVE.value,
            activated_by_user_id=tenant_user_id
        )
    )

    if not updated_qr:
        raise HTTPException(status_code=500, detail="Failed to activate QR code")

    return QRCodeResponse.from_orm(updated_qr)


@router.post("/{qr_code}/activate", response_model=QRCodeResponse)
async def activate_qr_code_with_pet(
    qr_code: str,
    pet_id: int = Query(..., description="Pet ID to associate with QR code"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Activate QR code and associate with a pet.

    Args:
        qr_code: QR code string
        pet_id: Pet ID to associate
        current_user: Current authenticated user
        db: Database session

    Returns:
        QRCodeResponse: Activated QR code
    """
    tenant_schema = get_tenant_schema_for_user(db, current_user)
    qr_service = QRCodeService(tenant_schema=tenant_schema)
    pet_service = PetService(tenant_schema=tenant_schema)

    # Verify pet exists
    pet = pet_service.get_pet(pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    # Activate QR code
    qr_obj = qr_service.activate_qr_code(qr_code, pet_id)
    if not qr_obj:
        raise HTTPException(
            status_code=404, detail="QR code not found or already active"
        )

    return QRCodeResponse.from_orm(qr_obj)


@router.put("/{qr_id}", response_model=QRCodeResponse)
async def update_qr_code(
    qr_id: int,
    qr_data: QRCodeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update a QR code.

    Args:
        qr_id: QR code ID
        qr_data: QR code update data
        current_user: Current authenticated user
        db: Database session

    Returns:
        QRCodeResponse: Updated QR code
    """
    tenant_schema = get_tenant_schema_for_user(db, current_user)
    qr_service = QRCodeService(tenant_schema=tenant_schema)
    qr_code = qr_service.update_qr_code(qr_id, qr_data)
    if not qr_code:
        raise HTTPException(status_code=404, detail="QR code not found")

    return QRCodeResponse.from_orm(qr_code)


@router.delete("/{qr_id}")
async def delete_qr_code(
    qr_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a QR code.

    Args:
        qr_id: QR code ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        dict: Deletion confirmation message

    Raises:
        HTTPException: If user is not a super admin or QR code not found
    """
    # Only super admins can delete QR codes
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can delete QR codes"
        )

    tenant_schema = get_tenant_schema_for_user(db, current_user)
    qr_service = QRCodeService(tenant_schema=tenant_schema)

    # Get QR code to verify it exists
    qr_code = qr_service.get_qr_code(qr_id)
    if not qr_code:
        raise HTTPException(status_code=404, detail="QR code not found")

    # Delete the QR code
    success = qr_service.delete_qr_code(qr_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete QR code")

    return {"message": f"QR code {qr_code.code} deleted successfully"}


def _execute_bulk_delete(task_id: str, qr_ids: List[int], qr_service: QRCodeService):
    """
    Execute bulk delete operation in background.

    Args:
        task_id: Task identifier for progress tracking
        qr_ids: List of QR code IDs to delete
        qr_service: QR code service instance
    """
    task_manager.update_task_progress(task_id, 0, 0, 0, TaskStatus.IN_PROGRESS)

    success_count = 0
    fail_count = 0

    for i, qr_id in enumerate(qr_ids):
        try:
            result = qr_service.delete_qr_code(qr_id)
            if result:
                success_count += 1
            else:
                fail_count += 1
        except Exception as e:
            print(f"[BulkDelete] Failed to delete QR {qr_id}: {e}")
            fail_count += 1

        # Update progress after each deletion
        processed = i + 1
        task_manager.update_task_progress(
            task_id,
            processed,
            success_count,
            fail_count
        )

    # Mark task as completed
    final_status = TaskStatus.COMPLETED if fail_count == 0 else TaskStatus.COMPLETED
    task_manager.update_task_progress(
        task_id,
        len(qr_ids),
        success_count,
        fail_count,
        final_status
    )


@router.post("/bulk-delete")
async def bulk_delete_qr_codes(
    request: BulkDeleteRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Start bulk delete operation for QR codes.

    This endpoint initiates the deletion process and returns a task ID
    that can be used to poll for progress.

    Args:
        request: Bulk delete request with QR code IDs
        background_tasks: FastAPI background tasks
        current_user: Current authenticated user
        db: Database session

    Returns:
        dict: Task ID and initial status
    """
    # Only super admins can bulk delete QR codes
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can bulk delete QR codes"
        )

    if not request.qr_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No QR code IDs provided"
        )

    tenant_schema = get_tenant_schema_for_user(db, current_user)
    qr_service = QRCodeService(tenant_schema=tenant_schema)

    # Create task
    task = task_manager.create_task("bulk_delete", len(request.qr_ids))

    # Start background task
    background_tasks.add_task(
        _execute_bulk_delete,
        task.task_id,
        request.qr_ids,
        qr_service
    )

    return {
        "task_id": task.task_id,
        "status": task.status.value,
        "total_items": task.total_items,
        "message": f"Bulk delete started for {len(request.qr_ids)} QR codes"
    }


@router.get("/bulk-delete/{task_id}")
async def get_bulk_delete_status(
    task_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Get status of a bulk delete operation.

    Args:
        task_id: Task identifier
        current_user: Current authenticated user

    Returns:
        dict: Task status and progress
    """
    # Only super admins can check bulk delete status
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can check bulk delete status"
        )

    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    return task.to_dict()


@router.post("/batch/generate", response_model=BatchQRCodeResponse)
async def generate_batch_qr_codes(
    batch_data: BatchQRCodeGenerate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate a batch of QR codes.

    Args:
        batch_data: Batch generation data
        current_user: Current authenticated user
        db: Database session

    Returns:
        BatchQRCodeResponse: Generated QR codes batch

    Raises:
        HTTPException: If user is not a super admin
    """
    # Only super admins can generate QR codes
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can generate QR codes"
        )

    try:
        # Determine target tenant schema
        if batch_data.assigned_to_tenant_id:
            # Generate QR codes in specific tenant schema
            tenant = db.exec(select(Tenant).where(Tenant.id == batch_data.assigned_to_tenant_id)).first()
            if not tenant:
                raise HTTPException(status_code=404, detail="Target tenant not found")
            # Replace hyphens with underscores for valid PostgreSQL schema names
            tenant_schema = f"tenant_{tenant.subdomain.replace('-', '_')}"
        else:
            # Use current user's tenant schema
            tenant_schema = get_tenant_schema_for_user(db, current_user)

        qr_service = QRCodeService(tenant_schema=tenant_schema)
        qr_codes = qr_service.generate_batch_qr_codes(
            quantity=batch_data.quantity,
            batch_id=batch_data.batch_id,
            physical_format=batch_data.physical_format,
        )

        return BatchQRCodeResponse(
            batch_id=qr_codes[0].batch_id,
            quantity=len(qr_codes),
            qr_codes=[QRCodeResponse.from_orm(qr_code) for qr_code in qr_codes],
            created_at=qr_codes[0].created_at,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate batch: {str(e)}"
        )


@router.get("/pet/{pet_id}", response_model=List[QRCodeResponse])
async def get_pet_qr_codes(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get QR codes associated with a specific pet.

    Args:
        pet_id: Pet ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        List[QRCodeResponse]: List of QR codes for the pet
    """
    tenant_schema = get_tenant_schema_for_user(db, current_user)
    qr_service = QRCodeService(tenant_schema=tenant_schema)
    pet_service = PetService(tenant_schema=tenant_schema)

    # Verify pet exists
    pet = pet_service.get_pet(pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    # Get QR codes for the pet
    qr_codes = qr_service.get_qr_codes_by_pet(pet_id)
    return [QRCodeResponse.from_orm(qr_code) for qr_code in qr_codes]


@router.post("/{qr_code}/scan")
async def record_scan(
    qr_code: str, qr_service: QRCodeService = Depends(get_qr_service)
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
    qr_image_service: QRImageService = Depends(get_qr_image_service),
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
            size=size,
        )

        media_type = "image/png" if format.lower() == "png" else "image/jpeg"
        return Response(content=image_bytes, media_type=media_type)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate QR image: {str(e)}"
        )


@router.get("/{qr_id}/download")
async def download_qr_code(
    qr_id: int,
    format: str = Query("png", description="Image format (png, jpg)"),
    size: int = Query(400, description="Image size in pixels"),
    current_user: User = Depends(get_current_user),
    qr_service: QRCodeService = Depends(get_qr_service),
    pet_service: PetService = Depends(get_pet_service),
    qr_image_service: QRImageService = Depends(get_qr_image_service),
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
            size=size,
        )

        media_type = "image/png" if format.lower() == "png" else "image/jpeg"
        filename = f"qr_code_{qr_obj.code}.{format.lower()}"

        return Response(
            content=image_bytes,
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate QR image: {str(e)}"
        )
