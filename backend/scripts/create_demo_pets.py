#!/usr/bin/env python3
"""
Create 5 demo pets with realistic information for testing.

This script creates demo pets for the logged-in user to test the pet grid UI.
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, select
from app.database import get_engine
from app.models.shared import User
from app.models.pet import Pet
from datetime import datetime
import random


# Demo pet data
DEMO_PETS = [
    {
        "name": "Max",
        "species": "dog",
        "breed": "Golden Retriever",
        "age_months": 36,  # 3 years
        "sex": "male",
        "size": "large",
        "color": "Golden",
        "weight": "32kg",
        "description": "Friendly and energetic golden retriever who loves to play fetch and swim.",
        "markings": "White chest patch",
        "medical_info": {
            "microchip_id": "982000123456789",
            "spayed_neutered": "yes",
            "medical_conditions": "None",
            "medications": "None",
            "allergies": "None",
            "veterinarian": "Dr. Sarah Johnson",
            "vet_clinic": "Happy Paws Veterinary Clinic",
            "vet_phone": "+1-555-0101"
        },
        "contact_info": {
            "emergency_contact_name": "John Smith",
            "emergency_contact_phone": "+1-555-0100"
        },
        "photos": [
            "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=400&h=400&fit=crop"
        ]
    },
    {
        "name": "Luna",
        "species": "cat",
        "breed": "Siamese",
        "age_months": 24,  # 2 years
        "sex": "female",
        "size": "small",
        "color": "Cream and Brown",
        "weight": "4.5kg",
        "description": "Elegant Siamese cat with striking blue eyes. Very vocal and affectionate.",
        "markings": "Dark points on ears, face, paws and tail",
        "medical_info": {
            "microchip_id": "982000987654321",
            "spayed_neutered": "yes",
            "medical_conditions": "None",
            "medications": "None",
            "allergies": "Sensitive to dairy products",
            "veterinarian": "Dr. Emily Chen",
            "vet_clinic": "City Cat Care",
            "vet_phone": "+1-555-0102"
        },
        "contact_info": {
            "emergency_contact_name": "Jane Doe",
            "emergency_contact_phone": "+1-555-0103"
        },
        "photos": [
            "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=400&h=400&fit=crop"
        ]
    },
    {
        "name": "Charlie",
        "species": "dog",
        "breed": "French Bulldog",
        "age_months": 18,  # 1.5 years
        "sex": "male",
        "size": "small",
        "color": "Brindle",
        "weight": "12kg",
        "description": "Playful French Bulldog with a big personality. Loves attention and cuddles.",
        "markings": "Black mask",
        "medical_info": {
            "microchip_id": "982000456789123",
            "spayed_neutered": "no",
            "medical_conditions": "Mild breathing sensitivity (brachycephalic)",
            "medications": "None",
            "allergies": "Chicken protein",
            "veterinarian": "Dr. Michael Brown",
            "vet_clinic": "Paws & Claws Animal Hospital",
            "vet_phone": "+1-555-0104"
        },
        "contact_info": {
            "emergency_contact_name": "Robert Johnson",
            "emergency_contact_phone": "+1-555-0105"
        },
        "photos": [
            "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop"
        ]
    },
    {
        "name": "Bella",
        "species": "dog",
        "breed": "Labrador Retriever",
        "age_months": 60,  # 5 years
        "sex": "female",
        "size": "large",
        "color": "Chocolate Brown",
        "weight": "29kg",
        "description": "Gentle and loyal chocolate lab. Great with children and other pets.",
        "markings": "Small white spot on chest",
        "medical_info": {
            "microchip_id": "982000789456123",
            "spayed_neutered": "yes",
            "medical_conditions": "Hip dysplasia (mild)",
            "medications": "Joint supplement daily",
            "allergies": "None",
            "veterinarian": "Dr. Lisa Anderson",
            "vet_clinic": "Riverside Veterinary Clinic",
            "vet_phone": "+1-555-0106"
        },
        "contact_info": {
            "emergency_contact_name": "Mary Williams",
            "emergency_contact_phone": "+1-555-0107"
        },
        "photos": [
            "https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=400&h=400&fit=crop"
        ]
    },
    {
        "name": "Milo",
        "species": "cat",
        "breed": "Maine Coon",
        "age_months": 48,  # 4 years
        "sex": "male",
        "size": "large",
        "color": "Silver Tabby",
        "weight": "7.5kg",
        "description": "Majestic Maine Coon with a gentle giant personality. Very sociable and dog-like.",
        "markings": "Classic tabby stripes with white paws",
        "medical_info": {
            "microchip_id": "982000321654987",
            "spayed_neutered": "yes",
            "medical_conditions": "None",
            "medications": "None",
            "allergies": "None",
            "veterinarian": "Dr. Jennifer Lee",
            "vet_clinic": "Feline Health Center",
            "vet_phone": "+1-555-0108"
        },
        "contact_info": {
            "emergency_contact_name": "David Miller",
            "emergency_contact_phone": "+1-555-0109"
        },
        "photos": [
            "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=400&fit=crop"
        ]
    }
]


def create_demo_pets():
    """Create demo pets in the database."""
    engine = get_engine()
    with Session(engine) as session:
        # Find a user to assign pets to (use the first regular user found)
        statement = select(User).where(User.role == "user")
        user = session.exec(statement).first()

        if not user:
            print("❌ Error: No regular user found in database.")
            print("   Please create a user first or log in to create one.")
            return

        print(f"✓ Found user: {user.email} (ID: {user.id}, Tenant: {user.tenant_id})")
        print(f"\nCreating 5 demo pets for user {user.email}...\n")

        created_pets = []

        for pet_data in DEMO_PETS:
            # Check if pet with same name already exists for this user
            existing = session.exec(
                select(Pet).where(
                    Pet.owner_id == user.id,
                    Pet.name == pet_data["name"]
                )
            ).first()

            if existing:
                print(f"⚠ Pet '{pet_data['name']}' already exists, skipping...")
                continue

            # Create pet
            pet = Pet(
                name=pet_data["name"],
                breed=pet_data["breed"],
                age_months=pet_data["age_months"],
                description=pet_data.get("description"),
                photos=pet_data.get("photos", []),
                medical_info=pet_data.get("medical_info", {}),
                contact_info=pet_data.get("contact_info", {}),
                owner_id=user.id,
                tenant_id=user.tenant_id
            )

            session.add(pet)
            created_pets.append(pet)

            print(f"✓ Created: {pet.name} ({pet.breed}) - {pet.age_months} months old")

        # Commit all pets
        session.commit()

        print(f"\n{'='*60}")
        print(f"✅ Successfully created {len(created_pets)} demo pets!")
        print(f"{'='*60}")
        print(f"\nYou can now view them at: http://localhost:3000/dashboard")
        print(f"Login with: {user.email}")
        print(f"\nPet Summary:")
        for pet in created_pets:
            age_years = pet.age_months // 12
            age_months_remainder = pet.age_months % 12
            age_str = f"{age_years}y {age_months_remainder}m" if age_months_remainder > 0 else f"{age_years} years"
            print(f"  • {pet.name} - {pet.breed} ({age_str})")


if __name__ == "__main__":
    print("="*60)
    print("Demo Pet Generator")
    print("="*60)
    create_demo_pets()
