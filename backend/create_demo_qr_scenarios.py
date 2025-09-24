#!/usr/bin/env python3
"""
Create demo QR codes for different test scenarios:
- demo123: Active and assigned to pet (works like DEMO123)
- demo456: Active but unassigned (needs registration)
- demo789: Inactive (needs activation)
- demo999: Will remain non-existent (invalid)
"""
import asyncio
import asyncpg

async def create_demo_scenarios():
    """Create demo QR codes for testing different scenarios"""
    try:
        # Connect to database
        conn = await asyncpg.connect('postgresql://postgres:postgres@localhost:5432/pet_qr_system')

        print("🧹 Cleaning up existing demo codes...")
        # Clean up existing demo codes first
        await conn.execute("DELETE FROM qr_codes WHERE code IN ('demo123', 'demo456', 'demo789')")

        print("\n📦 Creating demo QR codes...")

        # Scenario 1: demo123 - Active and assigned to a pet (like DEMO123)
        await conn.execute("""
            INSERT INTO qr_codes (code, pin, status, physical_format, created_at, pet_id)
            VALUES ('demo123', '1234', 'ACTIVE', 'sticker', NOW(), 1)
        """)
        print("✅ Created demo123: ACTIVE + assigned to pet_id=1")

        # Scenario 2: demo456 - Active but unassigned (needs registration)
        await conn.execute("""
            INSERT INTO qr_codes (code, pin, status, physical_format, created_at, pet_id)
            VALUES ('demo456', '5678', 'ACTIVE', 'sticker', NOW(), NULL)
        """)
        print("✅ Created demo456: ACTIVE + unassigned (pet_id=NULL)")

        # Scenario 3: demo789 - Inactive (needs activation)
        await conn.execute("""
            INSERT INTO qr_codes (code, pin, status, physical_format, created_at, pet_id)
            VALUES ('demo789', '9999', 'INACTIVE', 'sticker', NOW(), NULL)
        """)
        print("✅ Created demo789: INACTIVE + unassigned")

        print("\n🔍 Verifying created QR codes...")
        # Verify all codes were created correctly
        results = await conn.fetch("""
            SELECT code, status, pet_id,
                   CASE WHEN pet_id IS NOT NULL THEN 'assigned' ELSE 'unassigned' END as assignment_status
            FROM qr_codes
            WHERE code IN ('demo123', 'demo456', 'demo789', 'DEMO123')
            ORDER BY code
        """)

        for result in results:
            print(f"   {result['code']}: {result['status']} + {result['assignment_status']}")

        print("\n🎯 Test scenarios ready:")
        print("   http://localhost:3000/qr/demo123 → Should show 'QR Code Verified' then redirect to PIN")
        print("   http://localhost:3000/qr/demo456 → Should show 'Registration Required'")
        print("   http://localhost:3000/qr/demo789 → Should show 'QR Code Not Activated'")
        print("   http://localhost:3000/qr/demo999 → Should show 'Invalid QR Code'")

        await conn.close()

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(create_demo_scenarios())