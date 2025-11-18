#!/usr/bin/env python3
"""
Check what tables exist in schemas
"""

import asyncio
import sys
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Add the app directory to sys.path
sys.path.insert(0, os.path.dirname(__file__))

from app.core.config import settings

async def check_tables():
    """Check what tables exist in schemas"""
    engine = create_async_engine(settings.DATABASE_URL)

    async with engine.connect() as conn:
        # Check all schemas
        result = await conn.execute(text("""
            SELECT schema_name FROM information_schema.schemata
            WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
            ORDER BY schema_name
        """))
        schemas = [row[0] for row in result.fetchall()]
        print(f"Available schemas: {schemas}")

        # Check tenant_demo schema tables
        result = await conn.execute(text("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'tenant_demo'
            ORDER BY table_name
        """))
        tables = [row[0] for row in result.fetchall()]
        print(f"tenant_demo tables: {tables}")

        # Check demo schema tables
        result = await conn.execute(text("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'demo'
            ORDER BY table_name
        """))
        tables = [row[0] for row in result.fetchall()]
        print(f"demo tables: {tables}")

        # Check shared schema tables
        result = await conn.execute(text("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'shared'
            ORDER BY table_name
        """))
        tables = [row[0] for row in result.fetchall()]
        print(f"shared tables: {tables}")

        # Check users table columns
        result = await conn.execute(text("""
            SELECT column_name, data_type FROM information_schema.columns
            WHERE table_schema = 'shared' AND table_name = 'users'
            ORDER BY ordinal_position
        """))
        columns = [(row[0], row[1]) for row in result.fetchall()]
        print(f"users table columns: {columns}")

        # Check pets table columns
        result = await conn.execute(text("""
            SELECT column_name, data_type FROM information_schema.columns
            WHERE table_schema = 'demo' AND table_name = 'pets'
            ORDER BY ordinal_position
        """))
        columns = [(row[0], row[1]) for row in result.fetchall()]
        print(f"pets table columns: {columns}")

        # Check existing tenants
        await conn.execute(text("SET search_path TO shared"))
        result = await conn.execute(text("SELECT id, name, subdomain FROM tenants"))
        tenants = [(row[0], row[1], row[2]) for row in result.fetchall()]
        print(f"existing tenants: {tenants}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_tables())