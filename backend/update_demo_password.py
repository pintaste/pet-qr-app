#!/usr/bin/env python3
"""
Script to update demo@demo.com user password to demo123456
"""

import psycopg2
from urllib.parse import urlparse
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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

    # First, check if the user exists
    print("Checking for user@demo.com user...")
    cur.execute("""
        SELECT id, email, role
        FROM shared.users
        WHERE email = 'user@demo.com'
    """)

    result = cur.fetchone()
    if result:
        user_id, email, role = result
        print(f"✅ Found user: {email} (Role: {role}) - ID: {user_id}")

        # Hash the new password
        new_password = "demo123456"
        hashed_password = pwd_context.hash(new_password)
        print(f"🔐 Generated new password hash for: {new_password}")

        # Update the password
        cur.execute("""
            UPDATE shared.users
            SET password_hash = %s, updated_at = NOW()
            WHERE email = 'user@demo.com'
        """, (hashed_password,))

        conn.commit()

        print(f"✅ Successfully updated password for user@demo.com")
        print(f"📝 New credentials:")
        print(f"   Email: user@demo.com")
        print(f"   Password: demo123456")

        # Verify the update by checking the updated record
        cur.execute("""
            SELECT email, role, updated_at
            FROM shared.users
            WHERE email = 'user@demo.com'
        """)

        updated_user = cur.fetchone()
        if updated_user:
            email, role, updated_at = updated_user
            print(f"🔍 Verification - Email: {email}, Role: {role}, Updated: {updated_at}")

    else:
        print("❌ User user@demo.com not found in the database")
        print("📋 Available users:")

        # Show all users in shared schema
        cur.execute("""
            SELECT id, email, role, created_at
            FROM shared.users
            ORDER BY created_at DESC
        """)

        users = cur.fetchall()
        for user in users:
            user_id, email, role, created_at = user
            print(f"  - {email} (Role: {role}) - ID: {user_id}, Created: {created_at}")

    cur.close()
    conn.close()

except Exception as e:
    print(f"❌ Error: {e}")
    if 'conn' in locals():
        conn.rollback()