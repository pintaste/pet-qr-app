#!/usr/bin/env python3
"""
Script to add more photos to pet DEMO123
"""

import psycopg2
import json
from urllib.parse import urlparse

# Database connection details (from your settings)
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

    # First check the table structure
    print("Checking pets table structure...")
    cur.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'demo' AND table_name = 'pets'
        ORDER BY ordinal_position
    """)
    columns = cur.fetchall()
    for col in columns:
        print(f"  {col[0]} ({col[1]})")

    # Find the pet associated with DEMO123
    cur.execute("""
        SELECT p.id, p.name, p.photos
        FROM demo.pets p
        JOIN demo.qr_codes q ON q.pet_id = p.id
        WHERE q.code = 'DEMO123'
    """)

    result = cur.fetchone()
    if result:
        pet_id, pet_name, current_photos = result
        print(f"Found pet: {pet_name} (ID: {pet_id})")

        # Parse current photos
        if current_photos:
            photo_list = json.loads(current_photos) if isinstance(current_photos, str) else current_photos
        else:
            photo_list = []

        print(f"Current photos ({len(photo_list)}):")
        for i, photo in enumerate(photo_list):
            print(f"  {i+1}: {photo}")

        # Add new photos (high-quality Samoyed images)
        new_photos = [
            "https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=400&h=300&fit=crop&q=80",  # Samoyed portrait
            "https://images.unsplash.com/photo-1551717743-49959800b1f6?w=400&h=300&fit=crop&q=80",  # Samoyed playing
            "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop&q=80"   # Samoyed smiling
        ]

        # Combine existing and new photos
        updated_photos = photo_list + new_photos

        print(f"\nAdding {len(new_photos)} new photos...")
        print("New photos:")
        for i, photo in enumerate(new_photos):
            print(f"  {len(photo_list) + i + 1}: {photo}")

        # Update the database
        cur.execute("""
            UPDATE demo.pets
            SET photos = %s
            WHERE id = %s
        """, (json.dumps(updated_photos), pet_id))

        conn.commit()

        print(f"\n✅ Successfully updated pet photos!")
        print(f"Total photos now: {len(updated_photos)}")

    else:
        print("❌ Pet with QR code DEMO123 not found")

    cur.close()
    conn.close()

except Exception as e:
    print(f"❌ Error: {e}")