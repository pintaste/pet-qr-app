#!/usr/bin/env python3
"""
Create DEMO123 QR code with PIN 1234 directly in database
"""
import asyncio
import asyncpg

async def create_demo_qr():
    """Create or update DEMO123 QR code"""
    try:
        # Connect to database
        conn = await asyncpg.connect('postgresql://postgres:postgres@localhost:5432/pet_qr_system')

        # First check if DEMO123 exists
        existing = await conn.fetchrow("SELECT id, pin FROM qr_codes WHERE code = 'DEMO123'")

        if existing:
            print(f"DEMO123 already exists with ID {existing['id']} and PIN {existing['pin']}")
            # Update PIN to 1234
            await conn.execute("UPDATE qr_codes SET pin = '1234' WHERE code = 'DEMO123'")
            print("✅ Updated DEMO123 PIN to 1234")
        else:
            # Insert new DEMO123 record
            await conn.execute("""
                INSERT INTO qr_codes (code, pin, status, physical_format, created_at)
                VALUES ('DEMO123', '1234', 'active', 'sticker', NOW())
            """)
            print("✅ Created DEMO123 with PIN 1234")

        # Verify the record
        result = await conn.fetchrow("SELECT * FROM qr_codes WHERE code = 'DEMO123'")
        if result:
            print(f"✅ Verified: DEMO123 exists with PIN {result['pin']}")
        else:
            print("❌ Failed to create/update DEMO123")

        await conn.close()

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(create_demo_qr())