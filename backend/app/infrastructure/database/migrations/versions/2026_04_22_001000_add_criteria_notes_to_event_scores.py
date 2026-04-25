"""Add criteria_notes to event_scores

Revision ID: add_criteria_notes_to_event_scores
Revises: add_event_awards_tables
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "add_score_criteria_notes"
down_revision = "add_event_awards_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    from sqlalchemy import inspect
    inspector = inspect(op.get_bind())
    columns = [c['name'] for c in inspector.get_columns('event_scores')]
    if 'criteria_notes' not in columns:
        op.add_column(
            "event_scores",
            sa.Column("criteria_notes", postgresql.JSONB, nullable=True),
        )


def downgrade() -> None:
    op.drop_column("event_scores", "criteria_notes")
