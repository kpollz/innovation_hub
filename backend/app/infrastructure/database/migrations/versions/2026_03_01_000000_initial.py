"""initial schema - create all base tables

Revision ID: initial
Revises:
Create Date: 2026-03-01 00:00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- users ---
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('username', sa.String(50), unique=True, nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('email', sa.String(100), unique=True, nullable=True),
        sa.Column('full_name', sa.String(100), nullable=True),
        sa.Column('role', sa.String(20), server_default='member'),
        sa.Column('team', sa.String(50), nullable=True),
        sa.Column('avatar_url', sa.String(255), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    # --- problems ---
    op.create_table(
        'problems',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('status', sa.String(30), server_default='open'),
        sa.Column('author_id', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    # --- rooms ---
    op.create_table(
        'rooms',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('problem_id', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('problems.id', ondelete='SET NULL'), nullable=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(30), server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint('problem_id', name='uq_room_problem'),
    )

    # --- ideas ---
    op.create_table(
        'ideas',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('room_id', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('rooms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('outcome', sa.Text(), nullable=True),
        sa.Column('status', sa.String(30), server_default='draft'),
        sa.Column('author_id', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('is_pinned', sa.Boolean(), server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    # --- comments ---
    op.create_table(
        'comments',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('target_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('target_type', sa.String(20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('author_id', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('parent_id', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('comments.id', ondelete='CASCADE'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    # --- reactions ---
    op.create_table(
        'reactions',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('target_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('target_type', sa.String(20), nullable=False),
        sa.Column('type', sa.String(20), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint('target_id', 'target_type', 'user_id',
                            name='uq_reaction_target_user'),
    )

    # --- votes ---
    op.create_table(
        'votes',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('idea_id', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('ideas.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('stars', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint('idea_id', 'user_id', name='uq_vote_idea_user'),
        sa.CheckConstraint('stars BETWEEN 1 AND 5', name='check_stars_range'),
    )


def downgrade() -> None:
    op.drop_table('votes')
    op.drop_table('reactions')
    op.drop_table('comments')
    op.drop_table('ideas')
    op.drop_table('rooms')
    op.drop_table('problems')
    op.drop_table('users')
