"""Add event_teams and event_team_members tables

Revision ID: add_event_teams_tables
Revises: add_events_table
Create Date: 2026-04-16 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'add_event_teams_tables'
down_revision = 'add_events_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # event_teams table
    op.create_table(
        'event_teams',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('event_id', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('events.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('slogan', sa.String(255), nullable=True),
        sa.Column('leader_id', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('assigned_to_team_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    # event_team_members table
    # event_id is denormalized here to enforce UNIQUE(user_id, event_id) constraint
    op.create_table(
        'event_team_members',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('team_id', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('event_teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('event_id', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('events.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('joined_at', sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    # Unique constraint: 1 user = 1 team per event (includes pending members)
    op.create_unique_constraint('uq_user_event_team', 'event_team_members', ['user_id', 'event_id'])


def downgrade() -> None:
    op.drop_constraint('uq_user_event_team', 'event_team_members', type_='unique')
    op.drop_table('event_team_members')
    op.drop_table('event_teams')
