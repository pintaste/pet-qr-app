#!/usr/bin/env python3
"""
Script to insert demo QR code record into the database.
"""

import sys
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db_session
from app.models.pet import QRCode, Pet
from app.models.shared import User
from app.core.config import settings
from datetime import datetime

async def insert_demo_qr():
    """Insert demo QR code record."""
    async with get_db_session() as db:
        # First, check if a demo user exists, create one if not
        demo_user = await db.get(User, 1)  # Assuming user ID 1 exists
        if not demo_user:
            print("No demo user found. Please create a user first.")
            return False

        # Check if DEMO123 already exists
        existing_qr = await db.execute(
            "SELECT * FROM qr_codes WHERE code = 'DEMO123'"
        )
        if existing_qr.fetchone():
            print("QR code DEMO123 already exists!")
            return True

        # Create demo pet first
        demo_pet = Pet(
            name="Buddy",
            pet_type="dog",
            breed="Golden Retriever",
            gender="male",
            size="l",
            age_months=36,
            color="Golden",
            description="Friendly demo pet for testing",
            personality_traits=["friendly", "energetic", "playful"],
            owner_id=1,
            emergency_contact={
                "name": "Demo Owner",
                "phone": "+1-555-0123",
                "email": "demo@example.com"
            },
            medical_info={
                "vaccinations": {
                    "rabies": "2024-01-15",
                    "dhpp": "2024-01-15"
                }
            }
        )

        db.add(demo_pet)
        await db.commit()
        await db.refresh(demo_pet)

        # Create demo QR code
        demo_qr = QRCode(
            code="DEMO123",
            pin="1234",
            pet_id=demo_pet.id,
            batch_id="DEMO_BATCH",
            physical_format="sticker",
            is_active=True,
            is_assigned=True,
            owner_id=1,
            assigned_at=datetime.utcnow()
        )

        db.add(demo_qr)
        await db.commit()

        print(f"Successfully inserted demo QR code:")
        print(f"  Code: DEMO123")
        print(f"  PIN: 1234")
        print(f"  Pet: {demo_pet.name} (ID: {demo_pet.id})")
        print(f"  QR ID: {demo_qr.id}")

        return True

if __name__ == "__main__":
    asyncio.run(insert_demo_qr())