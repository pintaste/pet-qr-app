"""
Database connection and session management (sync version).
"""

from typing import Generator, Optional
from sqlmodel import Session, SQLModel, create_engine

from .core.config import settings


# Global engine variable
_engine: Optional = None


def get_sync_database_url():
    """Convert async database URL to sync version."""
    url = settings.DATABASE_URL
    if url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql+asyncpg://", "postgresql://")
    return url


def get_engine():
    """Get or create the database engine."""
    global _engine
    if _engine is None:
        _engine = create_engine(
            get_sync_database_url(),
            echo=settings.DEBUG,
            pool_pre_ping=True,
            pool_recycle=3600,
        )
    return _engine


def get_db() -> Generator[Session, None, None]:
    """
    Get database session (sync version).

    Yields:
        Session: Database session.
    """
    engine = get_engine()
    with Session(engine) as session:
        try:
            yield session
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()


def create_db_and_tables():
    """
    Create database tables.
    This is used for testing and initial setup.
    In production, use Alembic migrations.
    """
    engine = get_engine()
    SQLModel.metadata.create_all(engine)
