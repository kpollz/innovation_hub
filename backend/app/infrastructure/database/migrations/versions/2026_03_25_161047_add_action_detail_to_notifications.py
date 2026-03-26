"""add action_detail to notifications

Revision ID: add_action_detail
Revises: add_notifications
Create Date: 2026-03-25 16:10:47

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op


revision: str = 'add_action_detail'
down_revision: Union[str, None] = 'add_notifications'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('notifications', sa.Column('action_detail', sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column('notifications', 'action_detail')
