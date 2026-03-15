"""add summary to problems

Revision ID: add_summary
Revises: initial
Create Date: 2026-03-15 04:45:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_summary'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add summary column to problems table
    op.add_column('problems', sa.Column('summary', sa.String(500), nullable=True))


def downgrade() -> None:
    # Remove summary column from problems table
    op.drop_column('problems', 'summary')