"""
QR code image generation service.
"""

import io
import base64
from typing import Optional
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer, CircleModuleDrawer, SquareModuleDrawer
from PIL import Image, ImageDraw, ImageFont


class QRImageService:
    """Service for generating QR code images."""

    def __init__(self):
        """Initialize QR image service."""
        pass

    def generate_qr_image(
        self,
        data: str,
        size: int = 10,
        border: int = 4,
        fill_color: str = "black",
        back_color: str = "white",
        style: str = "square"
    ) -> bytes:
        """
        Generate QR code image as bytes.

        Args:
            data: Data to encode in QR code
            size: Size of QR code modules
            border: Border size around QR code
            fill_color: Color of QR code modules
            back_color: Background color
            style: QR code style ('square', 'rounded', 'circle')

        Returns:
            bytes: PNG image data
        """
        # Create QR code instance
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=size,
            border=border,
        )

        qr.add_data(data)
        qr.make(fit=True)

        # Choose module drawer based on style
        module_drawer = SquareModuleDrawer()
        if style == "rounded":
            module_drawer = RoundedModuleDrawer()
        elif style == "circle":
            module_drawer = CircleModuleDrawer()

        # Create image with style
        img = qr.make_image(
            image_factory=StyledPilImage,
            module_drawer=module_drawer,
            fill_color=fill_color,
            back_color=back_color
        )

        # Convert to bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)

        return img_bytes.getvalue()

    def generate_pet_qr_image(
        self,
        qr_code: str,
        landing_url: str,
        pin: str,
        pet_name: Optional[str] = None,
        size: int = 300
    ) -> bytes:
        """
        Generate a pet QR code image with branding and PIN.

        Args:
            qr_code: QR code string
            landing_url: Landing page URL
            pin: PIN code
            pet_name: Pet name (optional)
            size: Image size in pixels

        Returns:
            bytes: PNG image data
        """
        # Create QR code for the landing URL
        full_url = f"{landing_url}?qr={qr_code}"

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=8,
            border=2,
        )

        qr.add_data(full_url)
        qr.make(fit=True)

        # Create styled QR code
        qr_img = qr.make_image(
            image_factory=StyledPilImage,
            module_drawer=RoundedModuleDrawer(),
            fill_color="#007cba",
            back_color="white"
        )

        # Create final image with branding
        final_img = Image.new('RGB', (size, size + 120), 'white')

        # Resize QR code to fit
        qr_size = size - 40
        qr_img = qr_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)

        # Paste QR code
        qr_x = (size - qr_size) // 2
        qr_y = 20
        final_img.paste(qr_img, (qr_x, qr_y))

        # Add text elements
        draw = ImageDraw.Draw(final_img)

        try:
            # Try to use a better font if available
            title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
            text_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 18)
            pin_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
        except (OSError, IOError):
            # Fallback to default font
            title_font = ImageFont.load_default()
            text_font = ImageFont.load_default()
            pin_font = ImageFont.load_default()

        # Add title
        title = f"{pet_name}'s QR Code" if pet_name else "Pet QR Code"
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        title_width = title_bbox[2] - title_bbox[0]
        title_x = (size - title_width) // 2
        draw.text((title_x, qr_y + qr_size + 10), title, fill="#2c3e50", font=title_font)

        # Add QR code
        code_text = f"Code: {qr_code}"
        code_bbox = draw.textbbox((0, 0), code_text, font=text_font)
        code_width = code_bbox[2] - code_bbox[0]
        code_x = (size - code_width) // 2
        draw.text((code_x, qr_y + qr_size + 40), code_text, fill="#7f8c8d", font=text_font)

        # Add PIN with background
        pin_text = f"PIN: {pin}"
        pin_bbox = draw.textbbox((0, 0), pin_text, font=pin_font)
        pin_width = pin_bbox[2] - pin_bbox[0]
        pin_height = pin_bbox[3] - pin_bbox[1]
        pin_x = (size - pin_width) // 2
        pin_y = qr_y + qr_size + 70

        # Draw PIN background
        padding = 8
        draw.rounded_rectangle(
            [pin_x - padding, pin_y - padding, pin_x + pin_width + padding, pin_y + pin_height + padding],
            radius=8,
            fill="#e74c3c",
            outline=None
        )

        # Draw PIN text
        draw.text((pin_x, pin_y), pin_text, fill="white", font=pin_font)

        # Convert to bytes
        img_bytes = io.BytesIO()
        final_img.save(img_bytes, format='PNG', quality=95)
        img_bytes.seek(0)

        return img_bytes.getvalue()

    def generate_simple_qr_image(self, data: str) -> bytes:
        """
        Generate a simple QR code image.

        Args:
            data: Data to encode

        Returns:
            bytes: PNG image data
        """
        return self.generate_qr_image(data, size=8, border=2, fill_color="#007cba")

    def image_to_base64(self, image_bytes: bytes) -> str:
        """
        Convert image bytes to base64 string for embedding.

        Args:
            image_bytes: Image data as bytes

        Returns:
            str: Base64 encoded image data
        """
        return base64.b64encode(image_bytes).decode('utf-8')

    def get_data_url(self, image_bytes: bytes, mime_type: str = "image/png") -> str:
        """
        Convert image bytes to data URL for embedding in HTML.

        Args:
            image_bytes: Image data as bytes
            mime_type: MIME type of image

        Returns:
            str: Data URL string
        """
        base64_data = self.image_to_base64(image_bytes)
        return f"data:{mime_type};base64,{base64_data}"