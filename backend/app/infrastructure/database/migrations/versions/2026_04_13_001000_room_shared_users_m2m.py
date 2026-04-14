"""Convert room shared_user_ids ARRAY to many-to-many table

Revision ID: room_shared_users_m2m
Revises: add_room_privacy
Create Date: 2026-04-13 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import text

# revision identifiers
revision = 'room_shared_users_m2m'
down_revision = 'add_room_privacy'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create room_shared_users many-to-many association table
    op.create_table(
        'room_shared_users',
        sa.Column('room_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('rooms.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    )

    # Migrate existing data from ARRAY column to the new table
    op.execute(text("""
        INSERT INTO room_shared_users (room_id, user_id)
        SELECT id, unnest(shared_user_ids)
        FROM rooms
        WHERE shared_user_ids IS NOT NULL AND array_length(shared_user_ids, 1) > 0
    """))

    # Drop the ARRAY column
    op.drop_column('rooms', 'shared_user_ids')


def downgrade() -> None:
    # Re-add the ARRAY column
    op.add_column('rooms', sa.Column(
        'shared_user_ids', postgresql.ARRAY(postgresql.UUID(as_uuid=False)), nullable=True
    ))

    # Migrate data back from many-to-many to ARRAY
    op.execute(text("""
        UPDATE rooms SET shared_user_ids = aggregated.user_ids
        FROM (
            SELECT room_id, array_agg(user_id) AS user_ids
            FROM room_shared_users
            GROUP BY room_id
        ) AS aggregated
        WHERE rooms.id = aggregated.room_id
    """))

    # Drop the association table
    op.drop_table('room_shared_users')
