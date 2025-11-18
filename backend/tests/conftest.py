"""
Pytest fixtures and configuration for backend tests.
"""

import pytest
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import create_app
from app.database import get_db
from app.core.config import settings


@pytest.fixture(name="engine")
def engine_fixture():
    """
    Create an in-memory SQLite database engine for testing.

    Returns:
        Engine: SQLModel engine for testing.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    yield engine
    SQLModel.metadata.drop_all(engine)


@pytest.fixture(name="session")
def session_fixture(engine):
    """
    Create a database session for testing.

    Args:
        engine: Database engine fixture.

    Yields:
        Session: Database session for testing.
    """
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session):
    """
    Create a FastAPI test client with database session override.

    Args:
        session: Database session fixture.

    Yields:
        TestClient: FastAPI test client.
    """

    def get_session_override():
        return session

    app = create_app()
    app.dependency_overrides[get_db] = get_session_override

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture
def test_user_data():
    """
    Provide test user data.

    Returns:
        dict: Test user registration data.
    """
    return {
        "email": "test@example.com",
        "password": "SecureTestPass123!",
    }


@pytest.fixture
def test_pet_data():
    """
    Provide test pet data.

    Returns:
        dict: Test pet creation data.
    """
    return {
        "name": "Max",
        "breed": "Golden Retriever",
        "age": 36,  # 3 years in months
        "sex": "Male",
        "size": "Large",
        "color": "Golden",
        "description": "Friendly and energetic dog",
        "personality_traits": ["friendly", "energetic", "playful"],
    }


@pytest.fixture
def test_qr_data():
    """
    Provide test QR code data.

    Returns:
        dict: Test QR code data.
    """
    return {
        "qr_code": "TEST123",
        "pin": "1234",
    }
