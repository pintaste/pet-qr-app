#!/usr/bin/env python3
"""
Create 5 demo pets using the API endpoints.

This script creates demo pets by calling the pet API endpoints.
You need to be logged in first. The script will use your authentication.
"""

import requests
import json
from typing import Optional

# API Base URL
BASE_URL = "http://localhost:8000"

# Demo pet data (simplified for API)
DEMO_PETS = [
    {
        "name": "Max",
        "breed": "Golden Retriever",
        "age_months": 36,  # 3 years
        "description": "Friendly and energetic golden retriever who loves to play fetch and swim.",
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
        }
    },
    {
        "name": "Luna",
        "breed": "Siamese",
        "age_months": 24,  # 2 years
        "description": "Elegant Siamese cat with striking blue eyes. Very vocal and affectionate.",
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
        }
    },
    {
        "name": "Charlie",
        "breed": "French Bulldog",
        "age_months": 18,  # 1.5 years
        "description": "Playful French Bulldog with a big personality. Loves attention and cuddles.",
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
        }
    },
    {
        "name": "Bella",
        "breed": "Labrador Retriever",
        "age_months": 60,  # 5 years
        "description": "Gentle and loyal chocolate lab. Great with children and other pets.",
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
        }
    },
    {
        "name": "Milo",
        "breed": "Maine Coon",
        "age_months": 48,  # 4 years
        "description": "Majestic Maine Coon with a gentle giant personality. Very sociable and dog-like.",
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
        }
    }
]


def get_access_token() -> Optional[str]:
    """
    Get access token from user input.

    Returns:
        Access token if provided, None otherwise.
    """
    print("\n" + "="*60)
    print("Authentication Required")
    print("="*60)
    print("\nTo create demo pets, you need to be logged in.")
    print("\nOption 1: Provide your access token")
    print("  - Log in to the app at http://localhost:3000")
    print("  - Open browser DevTools (F12)")
    print("  - Go to Application/Storage > Local Storage")
    print("  - Copy the 'auth_token' value")
    print("\nOption 2: Provide email and password")
    print("")

    choice = input("Choose option (1 or 2): ").strip()

    if choice == "1":
        token = input("\nPaste your access token: ").strip()
        return token if token else None
    elif choice == "2":
        email = input("\nEmail: ").strip()
        password = input("Password: ").strip()

        # Try to login
        try:
            response = requests.post(
                f"{BASE_URL}/api/v1/auth/login",
                json={"email": email, "password": password}
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("access_token")
            else:
                print(f"❌ Login failed: {response.json()}")
                return None
        except Exception as e:
            print(f"❌ Error during login: {e}")
            return None
    else:
        print("❌ Invalid option")
        return None


def create_demo_pets_via_api(access_token: str):
    """Create demo pets using the API."""
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    print(f"\n{'='*60}")
    print("Creating 5 Demo Pets")
    print(f"{'='*60}\n")

    created_count = 0
    skipped_count = 0

    for pet_data in DEMO_PETS:
        try:
            response = requests.post(
                f"{BASE_URL}/api/v1/pets",
                headers=headers,
                json=pet_data
            )

            if response.status_code == 200:
                pet = response.json()
                created_count += 1
                age_years = pet_data['age_months'] // 12
                age_months = pet_data['age_months'] % 12
                age_str = f"{age_years}y {age_months}m" if age_months > 0 else f"{age_years} years"
                print(f"✓ Created: {pet_data['name']} ({pet_data['breed']}) - {age_str}")
            elif response.status_code == 400 and "already exists" in response.text.lower():
                skipped_count += 1
                print(f"⚠ Skipped: {pet_data['name']} (already exists)")
            else:
                print(f"❌ Failed to create {pet_data['name']}: {response.status_code}")
                print(f"   Response: {response.text}")
        except Exception as e:
            print(f"❌ Error creating {pet_data['name']}: {e}")

    print(f"\n{'='*60}")
    print(f"✅ Summary:")
    print(f"   Created: {created_count} pets")
    print(f"   Skipped: {skipped_count} pets (already existed)")
    print(f"{'='*60}")

    if created_count > 0:
        print(f"\nYou can now view your pets at: http://localhost:3000/dashboard")
        print(f"\nPet Summary:")
        for pet in DEMO_PETS:
            age_years = pet['age_months'] // 12
            age_months_remainder = pet['age_months'] % 12
            age_str = f"{age_years}y {age_months_remainder}m" if age_months_remainder > 0 else f"{age_years} years"
            print(f"  • {pet['name']} - {pet['breed']} ({age_str})")


def main():
    print("="*60)
    print("Demo Pet Generator (API)")
    print("="*60)

    # Get access token
    access_token = get_access_token()

    if not access_token:
        print("\n❌ No access token provided. Exiting.")
        return

    # Create pets
    create_demo_pets_via_api(access_token)


if __name__ == "__main__":
    main()
