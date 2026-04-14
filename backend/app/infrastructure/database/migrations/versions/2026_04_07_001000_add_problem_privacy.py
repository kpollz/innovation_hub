"""Add problem privacy (visibility + shared users)

Revision ID: 2026_04_07_001000
Revises: 2026_03_25_161047
Create Date: 2026-04-07 22:20:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'add_problem_privacy'
down_revision = 'add_action_detail'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add visibility column to problems table
    op.add_column(
        'problems',
        sa.Column('visibility', sa.String(20), nullable=False, server_default='public')
    )

    # Create association table for problem shared users
    op.create_table(
        'problem_shared_users',
        sa.Column('problem_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('problems.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    )


def downgrade() -> None:
    # Drop association table
    op.drop_table('problem_shared_users')

    # Remove visibility column
    op.drop_column('problems', 'visibility')