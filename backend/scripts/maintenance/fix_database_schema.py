#!/usr/bin/env python3
"""
Script to fix database schema issues
"""

import psycopg2
from urllib.parse import urlparse

# Database connection details
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/pet_qr_system"

# Parse the database URL
url = urlparse(DATABASE_URL)

try:
    # Connect to PostgreSQL database
    conn = psycopg2.connect(
        host=url.hostname,
        database=url.path[1:],
        user=url.username,
        password=url.password,
        port=url.port
    )

    cur = conn.cursor()

    print("🔧 Fixing database schema issues...")

    # 1. Check and add missing columns to pets table
    print("\n1. Checking pets table structure...")

    cur.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'demo' AND table_name = 'pets'
    """)
    existing_columns = [row[0] for row in cur.fetchall()]
    print(f"   Existing columns: {existing_columns}")

    # Add missing columns if they don't exist
    missing_columns = []

    required_columns = {
        'age': 'INTEGER',
        'sex': 'VARCHAR(10)',
        'size': 'VARCHAR(20)',
        'personality_traits': 'JSONB',
        'profile_photo_url': 'VARCHAR(500)',
        'photo_urls': 'JSONB',
        'basic_medical_info': 'JSONB',
        'emergency_contact': 'JSONB',
        'is_lost': 'BOOLEAN DEFAULT FALSE',
        'last_known_location': 'VARCHAR(500)'
    }

    for column, column_type in required_columns.items():
        if column not in existing_columns:
            print(f"   ➕ Adding missing column: {column}")
            cur.execute(f"""
                ALTER TABLE demo.pets
                ADD COLUMN IF NOT EXISTS {column} {column_type}
            """)
            missing_columns.append(column)

    if missing_columns:
        print(f"   ✅ Added columns: {missing_columns}")
    else:
        print("   ✅ All required columns exist")

    # 2. Fix QR code status enum values
    print("\n2. Checking QR code status values...")

    cur.execute("""
        SELECT DISTINCT status
        FROM demo.qr_codes
        WHERE status IS NOT NULL
    """)
    current_statuses = [row[0] for row in cur.fetchall()]
    print(f"   Current status values: {current_statuses}")

    # Update 'activated' to 'ACTIVE'
    if 'activated' in current_statuses:
        print("   🔄 Updating 'activated' status to 'ACTIVE'")
        cur.execute("""
            UPDATE demo.qr_codes
            SET status = 'ACTIVE'
            WHERE status = 'activated'
        """)

    # Update any other non-standard values
    status_mapping = {
        'active': 'ACTIVE',
        'inactive': 'INACTIVE',
        'expired': 'EXPIRED',
        'pending': 'INACTIVE'
    }

    for old_status, new_status in status_mapping.items():
        cur.execute(f"""
            UPDATE demo.qr_codes
            SET status = '{new_status}'
            WHERE LOWER(status) = '{old_status.lower()}'
        """)

    # 3. Update pet data with default values for new columns
    print("\n3. Setting default values for new columns...")

    # Update pets with missing age (set based on creation date)
    cur.execute("""
        UPDATE demo.pets
        SET age = CASE
            WHEN age IS NULL THEN 24 + FLOOR(RANDOM() * 60)
            ELSE age
        END,
        sex = CASE
            WHEN sex IS NULL THEN (ARRAY['Male', 'Female'])[FLOOR(RANDOM() * 2) + 1]
            ELSE sex
        END,
        size = CASE
            WHEN size IS NULL THEN (ARRAY['Small', 'Medium', 'Large'])[FLOOR(RANDOM() * 3) + 1]
            ELSE size
        END,
        is_lost = COALESCE(is_lost, FALSE),
        personality_traits = COALESCE(personality_traits, '["Friendly", "Playful"]'::jsonb),
        photo_urls = COALESCE(photo_urls, COALESCE(photos, '[]')::jsonb),
        basic_medical_info = COALESCE(basic_medical_info, '{}'::jsonb),
        emergency_contact = COALESCE(emergency_contact::jsonb, '{"phone": "+1-555-0123", "email": "owner@example.com"}'::jsonb)
    """)

    rows_updated = cur.rowcount
    print(f"   ✅ Updated {rows_updated} pet records with default values")

    # 4. Verify the fixes
    print("\n4. Verifying fixes...")

    # Check QR code statuses
    cur.execute("""
        SELECT status, COUNT(*)
        FROM demo.qr_codes
        GROUP BY status
        ORDER BY status
    """)
    status_counts = cur.fetchall()
    print(f"   QR Code status distribution: {dict(status_counts)}")

    # Check pets data
    cur.execute("""
        SELECT
            COUNT(*) as total_pets,
            COUNT(age) as pets_with_age,
            COUNT(sex) as pets_with_sex,
            COUNT(size) as pets_with_size
        FROM demo.pets
    """)
    pet_stats = cur.fetchone()
    print(f"   Pet data completeness: Total: {pet_stats[0]}, Age: {pet_stats[1]}, Sex: {pet_stats[2]}, Size: {pet_stats[3]}")

    # Commit all changes
    conn.commit()
    print("\n✅ Database schema fixes completed successfully!")

    cur.close()
    conn.close()

except Exception as e:
    print(f"❌ Error: {e}")
    if 'conn' in locals():
        conn.rollback()