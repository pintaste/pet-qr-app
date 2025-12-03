"""Add activation_count to QR codes

Revision ID: 3c9f0a4b5e6d
Revises: 2b8e9f3c4d5a
Create Date: 2025-11-23 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision: str = '3c9f0a4b5e6d'
down_revision: Union[str, None] = '2b8e9f3c4d5a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Add activation_count column to qr_codes tables in all tenant schemas.
    """
    # Get all tenant schemas
    connection = op.get_bind()

    # Get tenant schemas from shared.tenants
    # Schema names follow pattern: tenant_{subdomain.replace('-', '_')}
    result = connection.execute(
        text("SELECT subdomain FROM shared.tenants WHERE is_active = true")
    )
    tenant_schemas = [f"tenant_{row[0].replace('-', '_')}" for row in result]

    # Add activation_count to each tenant's qr_codes table
    for schema in tenant_schemas:
        # Check if column already exists
        check_result = connection.execute(
            text(f"""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = '{schema}'
                AND table_name = 'qr_codes'
                AND column_name = 'activation_count'
            """)
        )

        if check_result.fetchone() is None:
            connection.execute(
                text(f'ALTER TABLE "{schema}".qr_codes ADD COLUMN activation_count INTEGER NOT NULL DEFAULT 0')
            )


def downgrade() -> None:
    """
    Remove activation_count column from qr_codes tables in all tenant schemas.
    """
    connection = op.get_bind()

    # Get tenant schemas
    result = connection.execute(
        text("SELECT subdomain FROM shared.tenants WHERE is_active = true")
    )
    tenant_schemas = [f"tenant_{row[0].replace('-', '_')}" for row in result]

    # Remove activation_count from each tenant's qr_codes table
    for schema in tenant_schemas:
        connection.execute(
            text(f'ALTER TABLE "{schema}".qr_codes DROP COLUMN IF EXISTS activation_count')
        )
