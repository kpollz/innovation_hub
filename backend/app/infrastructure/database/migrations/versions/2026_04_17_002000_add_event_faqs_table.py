"""Add event_faqs table

Revision ID: add_event_faqs_table
Revises: add_event_scoring_tables
Create Date: 2026-04-17 14:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'add_event_faqs_table'
down_revision = 'add_event_scoring_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'event_faqs',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('event_id', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('events.id', ondelete='CASCADE'), nullable=False),
        sa.Column('question', sa.Text, nullable=False),
        sa.Column('answer', sa.Text, nullable=True),
        sa.Column('sort_order', sa.Integer, nullable=False, server_default='0'),
        sa.Column('created_by', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('event_faqs')
