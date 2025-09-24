"""
Tests for authentication functionality.
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.main import app
from app.database import get_db
from app.models.user import User
from app.core.security import get_password_hash


# Create test database
@pytest.fixture(name="session")
def session_fixture():
    """Create a test database session."""
    engine = create_engine(
        "sqlite:///test.db",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Create a test client."""
    def get_session_override():
        return session

    app.dependency_overrides[get_db] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_register_user(client: TestClient):
    """Test user registration."""
    response = client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "password": "testpassword123",
            "name": "Test User"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "user_id" in data


def test_register_duplicate_email(client: TestClient, session: Session):
    """Test registration with duplicate email."""
    # Create a user first
    user = User(
        email="test@example.com",
        full_name="Existing User",
        hashed_password=get_password_hash("password123"),
        is_active=True
    )
    session.add(user)
    session.commit()

    # Try to register with same email
    response = client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "password": "testpassword123",
            "name": "Test User"
        }
    )

    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


def test_login_success(client: TestClient, session: Session):
    """Test successful login."""
    # Create a user first
    user = User(
        email="test@example.com",
        full_name="Test User",
        hashed_password=get_password_hash("testpassword123"),
        is_active=True
    )
    session.add(user)
    session.commit()

    # Login
    response = client.post(
        "/auth/login",
        json={
            "email": "test@example.com",
            "password": "testpassword123"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["email"] == "test@example.com"


def test_login_invalid_credentials(client: TestClient):
    """Test login with invalid credentials."""
    response = client.post(
        "/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
    )

    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_access_protected_endpoint(client: TestClient, session: Session):
    """Test accessing protected endpoint with valid token."""
    # Create a user and get token
    user = User(
        email="test@example.com",
        full_name="Test User",
        hashed_password=get_password_hash("testpassword123"),
        is_active=True
    )
    session.add(user)
    session.commit()

    # Login to get token
    login_response = client.post(
        "/auth/login",
        json={
            "email": "test@example.com",
            "password": "testpassword123"
        }
    )
    token = login_response.json()["access_token"]

    # Access protected endpoint
    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"


def test_access_protected_endpoint_without_token(client: TestClient):
    """Test accessing protected endpoint without token."""
    response = client.get("/auth/me")

    assert response.status_code == 403  # No authorization header


def test_access_protected_endpoint_invalid_token(client: TestClient):
    """Test accessing protected endpoint with invalid token."""
    response = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer invalid_token"}
    )

    assert response.status_code == 401


def test_refresh_token(client: TestClient, session: Session):
    """Test token refresh functionality."""
    # Create a user and get tokens
    user = User(
        email="test@example.com",
        full_name="Test User",
        hashed_password=get_password_hash("testpassword123"),
        is_active=True
    )
    session.add(user)
    session.commit()

    # Login to get tokens
    login_response = client.post(
        "/auth/login",
        json={
            "email": "test@example.com",
            "password": "testpassword123"
        }
    )
    refresh_token = login_response.json()["refresh_token"]

    # Refresh token
    response = client.post(
        "/auth/refresh",
        json={"refresh_token": refresh_token}
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"