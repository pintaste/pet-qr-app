#!/usr/bin/env python3
"""
Quick script to make a user super admin.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings

def make_user_admin(email: str):
    """Make a user super admin."""
    engine = create_engine(settings.DATABASE_URL)

    with engine.connect() as conn:
        # Update user role to super_admin
        result = conn.execute(
            text("UPDATE shared.users SET role = 'SUPER_ADMIN' WHERE email = :email"),
            {"email": email}
        )
        conn.commit()
        print(f"Updated {result.rowcount} user(s) to super_admin role")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python make_admin.py <email>")
        sys.exit(1)

    email = sys.argv[1]
    make_user_admin(email)
    print(f"User {email} is now a super admin")