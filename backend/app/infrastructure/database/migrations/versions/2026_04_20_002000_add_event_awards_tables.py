"""Add event_awards and event_award_teams tables.

Revision ID: add_event_awards_tables
Revises: add_notif_reference_id
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PGUUID


revision = "add_event_awards_tables"
down_revision = "add_notif_reference_id"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "event_awards",
        sa.Column("id", PGUUID(as_uuid=False), primary_key=True),
        sa.Column(
            "event_id", PGUUID(as_uuid=False),
            sa.ForeignKey("events.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("rank_order", sa.Integer, nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True),
            server_default=sa.func.now(), nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "event_award_teams",
        sa.Column("id", PGUUID(as_uuid=False), primary_key=True),
        sa.Column(
            "award_id", PGUUID(as_uuid=False),
            sa.ForeignKey("event_awards.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column(
            "team_id", PGUUID(as_uuid=False),
            sa.ForeignKey("event_teams.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True),
            server_default=sa.func.now(), nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("award_id", "team_id", name="uq_award_team"),
    )


def downgrade() -> None:
    op.drop_table("event_award_teams")
    op.drop_table("event_awards")
