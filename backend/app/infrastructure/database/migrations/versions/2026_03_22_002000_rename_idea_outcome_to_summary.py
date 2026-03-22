"""rename idea outcome to summary

Revision ID: rename_outcome
Revises: drop_uq_update_idea
Create Date: 2026-03-22 00:20:00

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'rename_outcome'
down_revision: Union[str, None] = 'drop_uq_update_idea'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE ideas RENAME COLUMN outcome TO summary")


def downgrade() -> None:
    op.execute("ALTER TABLE ideas RENAME COLUMN summary TO outcome")
