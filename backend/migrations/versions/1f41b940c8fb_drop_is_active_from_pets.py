"""drop_is_active_from_pets

Revision ID: 1f41b940c8fb
Revises: 3c9f0a4b5e6d
Create Date: 2025-11-23 15:38:58.998077

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = '1f41b940c8fb'
down_revision: Union[str, None] = '3c9f0a4b5e6d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Drop is_active column from pets tables in all tenant schemas.
    Pets now use hard deletes instead of soft deletes.
    """
    connection = op.get_bind()

    # Get all tenant schemas from shared.tenants
    result = connection.execute(
        text("SELECT subdomain FROM shared.tenants WHERE is_active = true")
    )
    tenant_schemas = [f"tenant_{row[0].replace('-', '_')}" for row in result]

    # Drop is_active column from each tenant's pets table
    for schema in tenant_schemas:
        # Check if column exists before dropping
        check_result = connection.execute(
            text(f"""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = '{schema}'
                AND table_name = 'pets'
                AND column_name = 'is_active'
            """)
        )

        if check_result.fetchone() is not None:
            connection.execute(
                text(f'ALTER TABLE "{schema}".pets DROP COLUMN is_active')
            )


def downgrade() -> None:
    """
    Add is_active column back to pets tables in all tenant schemas.
    """
    connection = op.get_bind()

    # Get all tenant schemas
    result = connection.execute(
        text("SELECT subdomain FROM shared.tenants WHERE is_active = true")
    )
    tenant_schemas = [f"tenant_{row[0].replace('-', '_')}" for row in result]

    # Add is_active column back to each tenant's pets table
    for schema in tenant_schemas:
        # Check if column already exists
        check_result = connection.execute(
            text(f"""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = '{schema}'
                AND table_name = 'pets'
                AND column_name = 'is_active'
            """)
        )

        if check_result.fetchone() is None:
            connection.execute(
                text(f'ALTER TABLE "{schema}".pets ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true')
            )
