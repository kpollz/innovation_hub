"""Add event_ideas table for Event Idea submission

Revision ID: add_event_ideas_table
Revises: add_event_teams_tables
Create Date: 2026-04-16 14:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'add_event_ideas_table'
down_revision = 'add_event_teams_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'event_ideas',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('event_id', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('events.id', ondelete='CASCADE'), nullable=False),
        sa.Column('team_id', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('event_teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('user_problem', postgresql.JSONB, nullable=True),
        sa.Column('user_scenarios', postgresql.JSONB, nullable=True),
        sa.Column('user_expectation', postgresql.JSONB, nullable=True),
        sa.Column('research', postgresql.JSONB, nullable=True),
        sa.Column('solution', postgresql.JSONB, nullable=False),
        sa.Column('source_type', sa.String(20), nullable=False, server_default='manual'),
        sa.Column('source_problem_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('source_room_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('source_idea_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('author_id', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('event_ideas')
