"""Add reference_id to notifications for parent entity linking.

For event_idea notifications, reference_id stores the event_id so the
frontend can navigate to /events/{event_id}/ideas/{idea_id}.

Revision ID: add_reference_id_to_notifications
Revises: migrate_event_tiptap_to_jsonb
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PGUUID


revision = "add_notif_reference_id"
down_revision = "migrate_event_tiptap_to_jsonb"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "notifications",
        sa.Column("reference_id", PGUUID(as_uuid=False), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("notifications", "reference_id")
