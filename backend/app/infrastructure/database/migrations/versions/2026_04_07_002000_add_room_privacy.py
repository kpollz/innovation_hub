"""Add visibility and shared_user_ids to rooms table.

Revision ID: add_room_privacy
Revises: add_problem_privacy
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY, UUID as PGUUID

revision = "add_room_privacy"
down_revision = "add_problem_privacy"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("rooms", sa.Column("visibility", sa.String(20), nullable=False, server_default="public"))
    op.add_column("rooms", sa.Column("shared_user_ids", ARRAY(PGUUID(as_uuid=False)), nullable=True))


def downgrade() -> None:
    op.drop_column("rooms", "shared_user_ids")
    op.drop_column("rooms", "visibility")