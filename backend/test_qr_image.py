#!/usr/bin/env python3
"""
Simple QR code image generation test script.
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from app.services.qr_image import QRImageService

def test_qr_generation():
    """Test QR code image generation."""
    service = QRImageService()

    # Test 1: Simple QR code
    print("Generating simple QR code...")
    try:
        image_bytes = service.generate_simple_qr_image("https://example.com")
        print(f"✅ Simple QR code generated: {len(image_bytes)} bytes")
    except Exception as e:
        print(f"❌ Simple QR code failed: {e}")
        return False

    # Test 2: Pet QR code with branding
    print("Generating pet QR code with branding...")
    try:
        image_bytes = service.generate_pet_qr_image(
            qr_code="TEST123",
            landing_url="http://localhost:8000/scan",
            pin="1234",
            pet_name="Buddy",
            size=400
        )
        print(f"✅ Pet QR code generated: {len(image_bytes)} bytes")
    except Exception as e:
        print(f"❌ Pet QR code failed: {e}")
        return False

    # Test 3: Data URL conversion
    print("Testing data URL conversion...")
    try:
        data_url = service.get_data_url(image_bytes)
        print(f"✅ Data URL generated: {len(data_url)} chars")
        print(f"   Preview: {data_url[:100]}...")
    except Exception as e:
        print(f"❌ Data URL conversion failed: {e}")
        return False

    print("🎉 All QR image tests passed!")
    return True

if __name__ == "__main__":
    test_qr_generation()