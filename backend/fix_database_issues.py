#!/usr/bin/env python3
"""
Script to fix database issues found during login
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

    print("🔧 Fixing additional database issues...")

    # 1. Fix TenantTier enum values
    print("\n1. Fixing TenantTier enum values...")

    # Check current values
    cur.execute("""
        SELECT tier, COUNT(*)
        FROM shared.tenants
        GROUP BY tier
    """)
    current_tiers = cur.fetchall()
    print(f"   Current tier values: {current_tiers}")

    # Update 'standard' to 'STANDARD'
    cur.execute("""
        UPDATE shared.tenants
        SET tier = 'STANDARD'
        WHERE tier = 'standard'
    """)
    rows_updated = cur.rowcount
    print(f"   ✅ Updated {rows_updated} tenant records: 'standard' -> 'STANDARD'")

    # Update 'enterprise' to 'ENTERPRISE' if any exist
    cur.execute("""
        UPDATE shared.tenants
        SET tier = 'ENTERPRISE'
        WHERE tier = 'enterprise'
    """)
    rows_updated = cur.rowcount
    if rows_updated > 0:
        print(f"   ✅ Updated {rows_updated} tenant records: 'enterprise' -> 'ENTERPRISE'")

    # 2. Check if full_name column exists in users table
    print("\n2. Checking users table structure...")

    cur.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'shared' AND table_name = 'users'
        ORDER BY ordinal_position
    """)
    existing_columns = cur.fetchall()
    print(f"   Existing columns: {[col[0] for col in existing_columns]}")

    # Check if full_name column exists
    column_names = [col[0] for col in existing_columns]
    if 'full_name' not in column_names:
        print("   ➕ Adding missing full_name column...")
        cur.execute("""
            ALTER TABLE shared.users
            ADD COLUMN full_name VARCHAR(255)
        """)

        # Update existing users with default values
        cur.execute("""
            UPDATE shared.users
            SET full_name = 'Demo User'
            WHERE full_name IS NULL
        """)
        rows_updated = cur.rowcount
        print(f"   ✅ Added full_name column and updated {rows_updated} user records")
    else:
        print("   ✅ full_name column already exists")

    # Check if phone column exists
    if 'phone' not in column_names:
        print("   ➕ Adding missing phone column...")
        cur.execute("""
            ALTER TABLE shared.users
            ADD COLUMN phone VARCHAR(20)
        """)
        print("   ✅ Added phone column")
    else:
        print("   ✅ phone column already exists")

    # 3. Fix UserRole enum values
    print("\n3. Fixing UserRole enum values...")

    # Check current role values
    cur.execute("""
        SELECT role, COUNT(*)
        FROM shared.users
        GROUP BY role
    """)
    current_roles = cur.fetchall()
    print(f"   Current role values: {current_roles}")

    # Update 'user' to 'USER'
    cur.execute("""
        UPDATE shared.users
        SET role = 'USER'
        WHERE role = 'user'
    """)
    rows_updated = cur.rowcount
    if rows_updated > 0:
        print(f"   ✅ Updated {rows_updated} user records: 'user' -> 'USER'")

    # Update 'admin' to 'TENANT_ADMIN' if any exist
    cur.execute("""
        UPDATE shared.users
        SET role = 'TENANT_ADMIN'
        WHERE role = 'admin'
    """)
    rows_updated = cur.rowcount
    if rows_updated > 0:
        print(f"   ✅ Updated {rows_updated} user records: 'admin' -> 'TENANT_ADMIN'")

    # Update 'super_admin' to 'SUPER_ADMIN' if any exist
    cur.execute("""
        UPDATE shared.users
        SET role = 'SUPER_ADMIN'
        WHERE role = 'super_admin'
    """)
    rows_updated = cur.rowcount
    if rows_updated > 0:
        print(f"   ✅ Updated {rows_updated} user records: 'super_admin' -> 'SUPER_ADMIN'")

    # 4. Verify fixes
    print("\n4. Verifying fixes...")

    # Check tenant tiers
    cur.execute("""
        SELECT tier, COUNT(*)
        FROM shared.tenants
        GROUP BY tier
    """)
    updated_tiers = cur.fetchall()
    print(f"   Tenant tier distribution: {dict(updated_tiers)}")

    # Check user roles
    cur.execute("""
        SELECT role, COUNT(*)
        FROM shared.users
        GROUP BY role
    """)
    updated_roles = cur.fetchall()
    print(f"   User role distribution: {dict(updated_roles)}")

    # Check users table structure
    cur.execute("""
        SELECT COUNT(*) as total_users,
               COUNT(full_name) as users_with_name,
               COUNT(email) as users_with_email
        FROM shared.users
    """)
    user_stats = cur.fetchone()
    print(f"   User data: Total: {user_stats[0]}, With name: {user_stats[1]}, With email: {user_stats[2]}")

    # Commit all changes
    conn.commit()
    print("\n✅ All database fixes completed successfully!")

    cur.close()
    conn.close()

except Exception as e:
    print(f"❌ Error: {e}")
    if 'conn' in locals():
        conn.rollback()