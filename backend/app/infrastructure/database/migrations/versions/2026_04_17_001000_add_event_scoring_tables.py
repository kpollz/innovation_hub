"""Add event_scoring_criteria and event_scores tables

Revision ID: add_event_scoring_tables
Revises: add_event_ideas_table
Create Date: 2026-04-17 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'add_event_scoring_tables'
down_revision = 'add_event_ideas_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'event_scoring_criteria',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('event_id', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('events.id', ondelete='CASCADE'), nullable=False),
        sa.Column('group', sa.String(20), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('weight', sa.Float, nullable=False, server_default='1.0'),
        sa.Column('max_score', sa.Float, nullable=False, server_default='12.5'),
        sa.Column('sort_order', sa.Integer, nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        'event_scores',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('event_idea_id', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('event_ideas.id', ondelete='CASCADE'), nullable=False),
        sa.Column('scorer_team_id', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('event_teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('criteria_scores', postgresql.JSONB, nullable=False),
        sa.Column('total_score', sa.Float, nullable=False, server_default='0.0'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint('event_idea_id', 'scorer_team_id', name='uq_event_score_team'),
    )


def downgrade() -> None:
    op.drop_table('event_scores')
    op.drop_table('event_scoring_criteria')
