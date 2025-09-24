"""
Alembic environment configuration with multi-tenant support.
"""

import asyncio
import sys
import os
from logging.config import fileConfig
from typing import List

from sqlalchemy import pool, text
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context

# Add the app directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Import models to register them with SQLModel metadata
from app.models import *  # noqa: F403, F401
from app.core.config import settings
from sqlmodel import SQLModel

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = SQLModel.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def get_database_url() -> str:
    """Get database URL from settings."""
    return settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")


def get_tenant_schemas() -> List[str]:
    """
    Get list of tenant schemas to migrate.
    In production, this would query the database for active tenants.
    For now, we'll use default schemas.
    """
    return ["shared", "tenant_demo", "tenant_example"]


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.
    """
    url = get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        version_table="alembic_version",
    )

    schemas = get_tenant_schemas()

    with context.begin_transaction():
        # Create shared schema first
        if "shared" in schemas:
            context.execute(text("CREATE SCHEMA IF NOT EXISTS shared"))
            context.execute(text("SET search_path TO shared"))
            context.run_migrations()

        # Then create tenant schemas
        for schema in schemas:
            if schema != "shared":
                context.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema}"))
                context.execute(text(f"SET search_path TO {schema}"))
                context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Run migrations for all schemas."""
    schemas = get_tenant_schemas()

    # First, ensure all schemas exist
    for schema in schemas:
        connection.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema}"))

    # Create shared schema tables first
    if "shared" in schemas:
        connection.execute(text("SET search_path TO shared"))
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            version_table="alembic_version",
            version_table_schema="shared",
        )

        with context.begin_transaction():
            context.run_migrations()

    # Then create tenant schema tables
    for schema in schemas:
        if schema != "shared":
            connection.execute(text(f"SET search_path TO {schema}"))
            context.configure(
                connection=connection,
                target_metadata=target_metadata,
                version_table="alembic_version",
                version_table_schema=schema,
            )

            with context.begin_transaction():
                context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in async mode."""
    connectable = create_async_engine(
        get_database_url(),
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    # For async operations
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()