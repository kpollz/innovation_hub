"""drop room unique constraint and update idea statuses

Revision ID: drop_uq_update_idea
Revises: add_summary
Create Date: 2026-03-22 00:10:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'drop_uq_update_idea'
down_revision: Union[str, None] = 'add_summary'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop unique constraint on rooms.problem_id to allow multiple rooms per problem
    op.execute("ALTER TABLE rooms DROP CONSTRAINT IF EXISTS uq_room_problem")

    # Rename idea statuses: ready -> reviewing, selected -> submitted, rejected -> closed
    op.execute("UPDATE ideas SET status = 'reviewing' WHERE status = 'ready'")
    op.execute("UPDATE ideas SET status = 'submitted' WHERE status = 'selected'")
    op.execute("UPDATE ideas SET status = 'closed' WHERE status = 'rejected'")


def downgrade() -> None:
    # Revert idea statuses
    op.execute("UPDATE ideas SET status = 'ready' WHERE status = 'reviewing'")
    op.execute("UPDATE ideas SET status = 'selected' WHERE status = 'submitted'")
    op.execute("UPDATE ideas SET status = 'rejected' WHERE status = 'closed'")

    # Re-add unique constraint
    op.create_unique_constraint('uq_room_problem', 'rooms', ['problem_id'])
