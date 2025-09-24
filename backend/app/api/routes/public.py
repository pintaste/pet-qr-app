"""
Public routes that don't require authentication.
"""

from fastapi import APIRouter
from fastapi.responses import HTMLResponse
import os

router = APIRouter()


@router.get("/scan", response_class=HTMLResponse)
async def qr_scan_page():
    """
    Serve the QR code scanning landing page.

    Returns:
        HTMLResponse: QR code scanning interface
    """
    # Get the path to the HTML file
    html_file_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "..",
        "qr_scan_landing.html"
    )

    try:
        with open(html_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return HTMLResponse(content=content)
    except FileNotFoundError:
        return HTMLResponse(
            content="<h1>QR Scanner not found</h1>",
            status_code=404
        )


@router.get("/pet-info", response_class=HTMLResponse)
async def pet_info_demo():
    """
    Serve the pet information demo page.

    Returns:
        HTMLResponse: Pet information demo interface
    """
    # Get the path to the HTML file
    html_file_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "..",
        "pet_info_demo.html"
    )

    try:
        with open(html_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return HTMLResponse(content=content)
    except FileNotFoundError:
        return HTMLResponse(
            content="<h1>Pet info demo not found</h1>",
            status_code=404
        )