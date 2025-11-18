"""
Unit tests for QR code service.
"""

import pytest
from io import BytesIO

from app.services.qr_code import QRCodeService


class TestQRCodeService:
    """Tests for QR code generation and management."""

    @pytest.fixture
    def qr_service(self):
        """Create QR service instance for testing."""
        return QRCodeService()

    def test_generate_pin_creates_4_digit_pin(self, qr_service):
        """Test that PIN generation creates a 4-digit PIN."""
        pin = qr_service.generate_pin()

        # Reason: PIN should be exactly 4 digits
        assert len(pin) == 4
        assert pin.isdigit()
        assert 0 <= int(pin) <= 9999

    def test_generate_pin_creates_unique_pins(self, qr_service):
        """Test that multiple PIN generations create different PINs."""
        pins = [qr_service.generate_pin() for _ in range(100)]

        # Reason: With 100 generations, we should get at least some unique values
        # (not all 100 might be unique due to randomness, but most should be)
        unique_pins = set(pins)
        assert len(unique_pins) > 50  # At least 50% should be unique

    def test_generate_qr_code_creates_valid_identifier(self, qr_service):
        """Test that QR code generation creates valid UUID."""
        qr_code = qr_service.generate_qr_code()

        # Reason: Should be a valid UUID string
        assert isinstance(qr_code, str)
        assert len(qr_code) == 36  # UUID format: 8-4-4-4-12
        assert qr_code.count("-") == 4

    def test_generate_qr_code_creates_unique_codes(self, qr_service):
        """Test that QR code generation creates unique identifiers."""
        codes = [qr_service.generate_qr_code() for _ in range(100)]

        # Reason: UUIDs should all be unique
        unique_codes = set(codes)
        assert len(unique_codes) == 100

    def test_hash_pin_creates_valid_hash(self, qr_service):
        """Test that PIN hashing creates a valid hash."""
        pin = "1234"
        hashed = qr_service.hash_pin(pin)

        # Reason: Hash should be a bcrypt hash
        assert isinstance(hashed, str)
        assert hashed.startswith("$2b$")
        assert len(hashed) == 60

    def test_verify_pin_with_correct_pin(self, qr_service):
        """Test PIN verification with correct PIN."""
        pin = "1234"
        hashed = qr_service.hash_pin(pin)

        # Reason: Correct PIN should verify successfully
        assert qr_service.verify_pin(pin, hashed) is True

    def test_verify_pin_with_incorrect_pin(self, qr_service):
        """Test PIN verification with incorrect PIN."""
        pin = "1234"
        wrong_pin = "5678"
        hashed = qr_service.hash_pin(pin)

        # Reason: Incorrect PIN should fail verification
        assert qr_service.verify_pin(wrong_pin, hashed) is False

    @pytest.mark.parametrize(
        "pin",
        [
            "0000",  # All zeros
            "9999",  # All nines
            "1234",  # Sequential
            "5555",  # Same digit
        ],
    )
    def test_hash_and_verify_pin_edge_cases(self, qr_service, pin):
        """
        Test PIN hashing and verification with various PIN patterns.

        Args:
            qr_service: QR service fixture.
            pin: PIN to test.
        """
        hashed = qr_service.hash_pin(pin)
        assert qr_service.verify_pin(pin, hashed) is True

    def test_hash_pin_same_pin_different_hashes(self, qr_service):
        """Test that same PIN generates different hashes due to salt."""
        pin = "1234"
        hash1 = qr_service.hash_pin(pin)
        hash2 = qr_service.hash_pin(pin)

        # Reason: Different salts should create different hashes
        assert hash1 != hash2
        # Reason: But both should verify the same PIN
        assert qr_service.verify_pin(pin, hash1) is True
        assert qr_service.verify_pin(pin, hash2) is True
