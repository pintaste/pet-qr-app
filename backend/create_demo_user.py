#!/usr/bin/env python3
"""
Create a demo user with email user@demo.com and link to pet '00'
"""

import asyncio
import sys
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Add the app directory to sys.path
sys.path.insert(0, os.path.dirname(__file__))

from app.core.config import settings
from passlib.context import CryptContext

async def create_demo_user():
    """Create demo user and link to pet '00'"""

    # Create password hash
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed_password = pwd_context.hash("demo")

    # Create async engine
    engine = create_async_engine(settings.DATABASE_URL)

    async with engine.connect() as conn:
        # Users are in shared schema
        await conn.execute(text("SET search_path TO shared"))

        # Check if user already exists
        result = await conn.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": "user@demo.com"}
        )
        user = result.fetchone()

        if user:
            print(f"User already exists with ID: {user[0]}")
            user_id = user[0]
        else:
            # Get tenant_id (use the existing demo tenant)
            await conn.execute(text("SET search_path TO shared"))
            result = await conn.execute(text("SELECT id FROM tenants WHERE subdomain = 'demo'"))
            tenant = result.fetchone()
            if not tenant:
                print("Error: Demo tenant not found!")
                return
            else:
                tenant_id = tenant[0]
                print(f"Found demo tenant with ID: {tenant_id}")

            # Create the demo user
            result = await conn.execute(
                text("""
                    INSERT INTO users (email, password_hash, tenant_id, is_active, role, created_at, updated_at)
                    VALUES (:email, :password, :tenant_id, :is_active, :role, NOW(), NOW())
                    RETURNING id
                """),
                {
                    "email": "user@demo.com",
                    "password": hashed_password,
                    "tenant_id": tenant_id,
                    "is_active": True,
                    "role": "user"
                }
            )
            user_id = result.fetchone()[0]
            print(f"Created demo user with ID: {user_id}")

        # Pets are in demo schema
        await conn.execute(text("SET search_path TO demo"))

        # Find pet '00'
        result = await conn.execute(
            text("SELECT id FROM pets WHERE name = :name"),
            {"name": "00"}
        )
        pet = result.fetchone()

        if not pet:
            print("Pet '00' not found!")
            return

        pet_id = pet[0]
        print(f"Found pet '00' with ID: {pet_id}")

        # Update pet to be owned by demo user
        await conn.execute(
            text("UPDATE pets SET owner_id = :owner_id WHERE id = :pet_id"),
            {"owner_id": user_id, "pet_id": pet_id}
        )
        print("Linked pet '00' to demo user")

        # Verify the connection (cross-schema query)
        result = await conn.execute(
            text("""
                SELECT u.email, p.name, p.breed
                FROM shared.users u
                JOIN demo.pets p ON u.id = p.owner_id
                WHERE u.email = 'user@demo.com' AND p.name = '00'
            """)
        )
        verification = result.fetchone()

        if verification:
            print(f"✅ Successfully created: {verification[0]} owns pet '{verification[1]}' ({verification[2]})")
        else:
            print("❌ Verification failed - connection not found")

        # Commit the transaction
        await conn.commit()

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_demo_user())