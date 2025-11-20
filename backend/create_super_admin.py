#!/usr/bin/env python3
"""
Create a super admin user in the system.

Usage: python create_super_admin.py
"""

from app.database import get_engine
from app.models.shared import User, UserRole
from sqlmodel import Session, select
from sqlalchemy import text
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)

def create_super_admin():
    """Create a super admin user."""

    email = "admin@qq.com"
    password = "qq1025520"

    engine = get_engine()
    session = Session(engine)

    try:
        # Check if user already exists
        statement = select(User).where(User.email == email)
        existing_user = session.exec(statement).first()

        if existing_user:
            print(f"✅ User {email} already exists!")
            print(f"   Role: {existing_user.role}")
            print(f"   Active: {existing_user.is_active}")

            # Update to super admin if not already
            if existing_user.role != UserRole.SUPER_ADMIN:
                existing_user.role = UserRole.SUPER_ADMIN
                session.add(existing_user)
                session.commit()
                print(f"   Updated role to SUPER_ADMIN")

            return

        # Create new super admin user
        password_hash = hash_password(password)

        user = User(
            email=email,
            password_hash=password_hash,
            role=UserRole.SUPER_ADMIN,
            is_active=True,
            tenant_id=None  # Super admin has no tenant
        )

        session.add(user)
        session.commit()
        session.refresh(user)

        print("=" * 60)
        print("✅ Super Admin User Created Successfully!")
        print("=" * 60)
        print(f"Email: {user.email}")
        print(f"Password: {password}")
        print(f"Role: {user.role}")
        print(f"User ID: {user.id}")
        print(f"Active: {user.is_active}")
        print("=" * 60)
        print("\nYou can now login with these credentials!")

    except Exception as e:
        print(f"❌ Error creating super admin: {e}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    create_super_admin()
