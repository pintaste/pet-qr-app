"""
QR Code generation utilities.
"""

import qrcode
import io
import base64
import secrets
import string
from typing import Optional
from PIL import Image

from ..core.config import settings


def generate_qr_code_id() -> str:
    """
    Generate a unique QR code identifier.

    Returns:
        str: Unique QR code identifier
    """
    # Generate a random alphanumeric string
    alphabet = string.ascii_uppercase + string.digits
    # Exclude confusing characters
    alphabet = alphabet.replace('0', '').replace('O', '').replace('1', '').replace('I', '')

    return ''.join(secrets.choice(alphabet) for _ in range(12))


def generate_pin() -> str:
    """
    Generate a random 4-digit PIN.

    Returns:
        str: 4-digit PIN
    """
    return ''.join(secrets.choice(string.digits) for _ in range(4))


def create_qr_code_image(qr_code_id: str, size: int = None) -> tuple[str, bytes]:
    """
    Create QR code image for the given QR code ID.

    Args:
        qr_code_id: QR code identifier
        size: Size of the QR code image (default from settings)

    Returns:
        tuple: (base64_encoded_image, raw_image_bytes)
    """
    if size is None:
        size = settings.DEFAULT_QR_SIZE

    # Create the URL that the QR code will point to
    qr_url = f"{settings.QR_CODE_BASE_URL}/{qr_code_id}"

    # Create QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_url)
    qr.make(fit=True)

    # Create image
    img = qr.make_image(fill_color="black", back_color="white")

    # Resize if needed
    if img.size != (size, size):
        img = img.resize((size, size), Image.Resampling.LANCZOS)

    # Convert to bytes
    img_buffer = io.BytesIO()
    img.save(img_buffer, format='PNG')
    img_bytes = img_buffer.getvalue()

    # Convert to base64 for storage/transmission
    img_base64 = base64.b64encode(img_bytes).decode('utf-8')

    return img_base64, img_bytes


def create_branded_qr_code(qr_code_id: str, logo_url: Optional[str] = None, size: int = None) -> tuple[str, bytes]:
    """
    Create a branded QR code with optional logo overlay.

    Args:
        qr_code_id: QR code identifier
        logo_url: URL to logo image (optional)
        size: Size of the QR code image

    Returns:
        tuple: (base64_encoded_image, raw_image_bytes)
    """
    if size is None:
        size = settings.DEFAULT_QR_SIZE

    # Create basic QR code
    qr_url = f"{settings.QR_CODE_BASE_URL}/{qr_code_id}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,  # Higher error correction for logo overlay
        box_size=10,
        border=4,
    )
    qr.add_data(qr_url)
    qr.make(fit=True)

    # Create image
    img = qr.make_image(fill_color="black", back_color="white").convert('RGB')

    # Add logo if provided
    if logo_url:
        try:
            # This would download and overlay the logo
            # For now, we'll just use the basic QR code
            pass
        except Exception:
            # If logo processing fails, continue with basic QR code
            pass

    # Resize if needed
    if img.size != (size, size):
        img = img.resize((size, size), Image.Resampling.LANCZOS)

    # Convert to bytes
    img_buffer = io.BytesIO()
    img.save(img_buffer, format='PNG')
    img_bytes = img_buffer.getvalue()

    # Convert to base64
    img_base64 = base64.b64encode(img_bytes).decode('utf-8')

    return img_base64, img_bytes


def validate_qr_code_format(qr_code_id: str) -> bool:
    """
    Validate QR code ID format.

    Args:
        qr_code_id: QR code identifier to validate

    Returns:
        bool: True if valid format
    """
    if not qr_code_id:
        return False

    # Check length
    if len(qr_code_id) != 12:
        return False

    # Check characters (alphanumeric, excluding confusing ones)
    allowed_chars = set(string.ascii_uppercase + string.digits)
    allowed_chars.discard('0')
    allowed_chars.discard('O')
    allowed_chars.discard('1')
    allowed_chars.discard('I')

    return all(c in allowed_chars for c in qr_code_id)


def generate_batch_qr_codes(quantity: int, batch_id: Optional[str] = None) -> list[dict]:
    """
    Generate a batch of QR codes.

    Args:
        quantity: Number of QR codes to generate
        batch_id: Optional batch identifier

    Returns:
        list: List of QR code data dictionaries
    """
    if batch_id is None:
        batch_id = f"BATCH{secrets.token_hex(4).upper()}"

    qr_codes = []

    for i in range(quantity):
        qr_code_id = generate_qr_code_id()
        pin = generate_pin()

        # Generate QR code image
        img_base64, img_bytes = create_qr_code_image(qr_code_id)

        qr_data = {
            "code": qr_code_id,
            "pin": pin,
            "qr_data": f"{settings.QR_CODE_BASE_URL}/{qr_code_id}",
            "qr_image_base64": img_base64,
            "batch_id": batch_id,
            "sequence_number": i + 1
        }

        qr_codes.append(qr_data)

    return qr_codes


def get_qr_code_stats(qr_codes: list) -> dict:
    """
    Get statistics for a batch of QR codes.

    Args:
        qr_codes: List of QR code objects

    Returns:
        dict: Statistics about the QR codes
    """
    total = len(qr_codes)
    active = sum(1 for qr in qr_codes if qr.is_active)
    assigned = sum(1 for qr in qr_codes if qr.is_assigned)
    total_scans = sum(qr.scan_count for qr in qr_codes)

    return {
        "total": total,
        "active": active,
        "assigned": assigned,
        "unassigned": total - assigned,
        "inactive": total - active,
        "total_scans": total_scans,
        "average_scans": total_scans / total if total > 0 else 0
    }