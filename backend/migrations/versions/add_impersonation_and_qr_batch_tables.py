"""Add impersonation and QR batch tables

Revision ID: 2b8e9f3c4d5a
Revises: fa384e02ebfb
Create Date: 2025-11-19 02:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '2b8e9f3c4d5a'
down_revision: Union[str, None] = 'fa384e02ebfb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Create tables for impersonation logging and QR batch management.
    """
    # Create impersonation_logs table in shared schema
    op.create_table(
        'impersonation_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('super_admin_id', sa.Integer(), nullable=False),
        sa.Column('impersonated_user_id', sa.Integer(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('ended_at', sa.DateTime(), nullable=True),
        sa.Column('actions_taken', sa.JSON(), nullable=True),
        sa.Column('ip_address', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=True),
        sa.ForeignKeyConstraint(['super_admin_id'], ['shared.users.id']),
        sa.ForeignKeyConstraint(['impersonated_user_id'], ['shared.users.id']),
        sa.PrimaryKeyConstraint('id'),
        schema='shared'
    )

    # Create qr_batches table in shared schema
    op.create_table(
        'qr_batches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('batch_id', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('assigned_to_tenant_id', sa.Integer(), nullable=True),
        sa.Column('created_by_admin_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('print_data', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['assigned_to_tenant_id'], ['shared.tenants.id']),
        sa.ForeignKeyConstraint(['created_by_admin_id'], ['shared.users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('batch_id'),
        schema='shared'
    )

    # Add index on batch_id for faster lookups
    op.create_index(
        'ix_qr_batches_batch_id',
        'qr_batches',
        ['batch_id'],
        unique=True,
        schema='shared'
    )

    # Add index on assigned_to_tenant_id for faster tenant queries
    op.create_index(
        'ix_qr_batches_assigned_to_tenant_id',
        'qr_batches',
        ['assigned_to_tenant_id'],
        schema='shared'
    )


def downgrade() -> None:
    """
    Drop impersonation and QR batch tables.
    """
    # Drop indexes
    op.drop_index('ix_qr_batches_assigned_to_tenant_id', table_name='qr_batches', schema='shared')
    op.drop_index('ix_qr_batches_batch_id', table_name='qr_batches', schema='shared')

    # Drop tables
    op.drop_table('qr_batches', schema='shared')
    op.drop_table('impersonation_logs', schema='shared')
