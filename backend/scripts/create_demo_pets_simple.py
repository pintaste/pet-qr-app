#!/usr/bin/env python3
"""
Create 5 demo pets directly in the database using SQL.
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import get_engine
from sqlmodel import Session, text
import json


# Demo pet data
DEMO_PETS = [
    {
        "name": "Max",
        "breed": "Golden Retriever",
        "age": 36,
        "description": "Friendly and energetic golden retriever who loves to play fetch and swim.",
        "photos": ["https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=400&h=400&fit=crop"],
        "medical_info": {
            "microchip_id": "982000123456789",
            "spayed_neutered": "yes",
            "medical_conditions": "None"
        },
        "contact_info": {
            "emergency_contact_name": "John Smith",
            "emergency_contact_phone": "+1-555-0100"
        }
    },
    {
        "name": "Luna",
        "breed": "Siamese",
        "age": 24,
        "description": "Elegant Siamese cat with striking blue eyes. Very vocal and affectionate.",
        "photos": ["https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=400&h=400&fit=crop"],
        "medical_info": {
            "microchip_id": "982000987654321",
            "spayed_neutered": "yes"
        },
        "contact_info": {
            "emergency_contact_name": "Jane Doe",
            "emergency_contact_phone": "+1-555-0103"
        }
    },
    {
        "name": "Charlie",
        "breed": "French Bulldog",
        "age": 18,
        "description": "Playful French Bulldog with a big personality. Loves attention and cuddles.",
        "photos": ["https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop"],
        "medical_info": {
            "microchip_id": "982000456789123",
            "medical_conditions": "Mild breathing sensitivity (brachycephalic)"
        },
        "contact_info": {
            "emergency_contact_name": "Robert Johnson",
            "emergency_contact_phone": "+1-555-0105"
        }
    },
    {
        "name": "Bella",
        "breed": "Labrador Retriever",
        "age": 60,
        "description": "Gentle and loyal chocolate lab. Great with children and other pets.",
        "photos": ["https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=400&h=400&fit=crop"],
        "medical_info": {
            "microchip_id": "982000789456123",
            "spayed_neutered": "yes",
            "medical_conditions": "Hip dysplasia (mild)"
        },
        "contact_info": {
            "emergency_contact_name": "Mary Williams",
            "emergency_contact_phone": "+1-555-0107"
        }
    },
    {
        "name": "Milo",
        "breed": "Maine Coon",
        "age": 48,
        "description": "Majestic Maine Coon with a gentle giant personality. Very sociable and dog-like.",
        "photos": ["https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=400&fit=crop"],
        "medical_info": {
            "microchip_id": "982000321654987",
            "spayed_neutered": "yes"
        },
        "contact_info": {
            "emergency_contact_name": "David Miller",
            "emergency_contact_phone": "+1-555-0109"
        }
    }
]


def create_demo_pets():
    """Create demo pets directly in the database."""
    engine = get_engine()

    with Session(engine) as session:
        # Check for tenant_demo schema
        result = session.exec(text("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'tenant_demo'"))
        if not result.first():
            print("❌ Error: tenant_demo schema not found")
            print("   Please ensure the database is set up and you have a tenant created.")
            return

        # Get the first user from tenant_users
        result = session.exec(text("SELECT id FROM tenant_demo.tenant_users ORDER BY id LIMIT 1"))
        user_row = result.first()

        if not user_row:
            print("❌ Error: No users found in tenant_demo.tenant_users")
            print("   Please create a user first by logging into the app.")
            return

        owner_id = user_row[0]
        print(f"✓ Found user ID: {owner_id}")
        print(f"\nCreating 5 demo pets...\n")

        created_count = 0
        skipped_count = 0

        for pet_data in DEMO_PETS:
            # Check if pet already exists
            check_stmt = text("SELECT id FROM tenant_demo.pets WHERE name = :name AND owner_id = :owner_id")
            check_result = session.execute(check_stmt, {"name": pet_data["name"], "owner_id": owner_id})
            if check_result.first():
                print(f"⚠ Pet '{pet_data['name']}' already exists, skipping...")
                skipped_count += 1
                continue

            # Insert pet
            insert_sql = """
            INSERT INTO tenant_demo.pets (
                name, breed, age, description, photos, medical_info, owner_id, created_at, updated_at
            ) VALUES (
                :name, :breed, :age, :description, :photos, :medical_info, :owner_id, NOW(), NOW()
            )
            """

            session.execute(
                text(insert_sql),
                {
                    "name": pet_data["name"],
                    "breed": pet_data["breed"],
                    "age": pet_data["age"],
                    "description": pet_data.get("description"),
                    "photos": json.dumps(pet_data.get("photos", [])),
                    "medical_info": json.dumps(pet_data.get("medical_info", {})),
                    "owner_id": owner_id
                }
            )

            created_count += 1
            age_years = pet_data["age"] // 12
            age_months_remainder = pet_data["age"] % 12
            age_str = f"{age_years}y {age_months_remainder}m" if age_months_remainder > 0 else f"{age_years} years"
            print(f"✓ Created: {pet_data['name']} ({pet_data['breed']}) - {age_str}")

        # Commit the transaction
        session.commit()

        print(f"\n{'='*60}")
        print(f"✅ Summary:")
        print(f"   Created: {created_count} pets")
        print(f"   Skipped: {skipped_count} pets (already existed)")
        print(f"{'='*60}")

        if created_count > 0:
            print(f"\nYou can now view your pets at: http://localhost:3000/dashboard")
            print(f"\nPet Summary:")
            for pet in DEMO_PETS:
                age_years = pet['age'] // 12
                age_months_remainder = pet['age'] % 12
                age_str = f"{age_years}y {age_months_remainder}m" if age_months_remainder > 0 else f"{age_years} years"
                print(f"  • {pet['name']} - {pet['breed']} ({age_str})")


if __name__ == "__main__":
    print("="*60)
    print("Demo Pet Generator")
    print("="*60)
    create_demo_pets()
