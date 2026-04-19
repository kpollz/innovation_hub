"""Migrate events.description and event_faqs.answer from TEXT to JSONB

Revision ID: migrate_event_tiptap_to_jsonb
Revises: migrate_tiptap_to_jsonb
Create Date: 2026-04-19 10:00:00.000000
"""
from alembic import op
from sqlalchemy import text as sa_text

from app.application.use_cases.event_idea.html_to_tiptap import html_to_tiptap
import json

revision = "migrate_event_tiptap_to_jsonb"
down_revision = "migrate_tiptap_to_jsonb"
branch_labels = None
depends_on = None


def _migrate_text_to_jsonb(table: str, column: str) -> None:
    """Read TEXT rows, convert HTML→TipTap JSON, write back as JSONB."""
    conn = op.get_bind()

    tmp_col = f"{column}_jsonb"
    op.execute(f'ALTER TABLE {table} ADD COLUMN "{tmp_col}" JSONB')

    rows = conn.execute(sa_text(f'SELECT id, {column} FROM {table}')).fetchall()

    for row in rows:
        raw = row[1]
        if raw is None:
            tiptap = None
        else:
            tiptap = html_to_tiptap(raw)

        if tiptap is not None:
            conn.execute(
                sa_text(f'UPDATE {table} SET "{tmp_col}" = :val WHERE id = :id'),
                {"val": json.dumps(tiptap), "id": row[0]},
            )

    op.execute(f'ALTER TABLE {table} DROP COLUMN {column}')
    op.execute(f'ALTER TABLE {table} RENAME COLUMN "{tmp_col}" TO {column}')


def upgrade() -> None:
    _migrate_text_to_jsonb("events", "description")
    _migrate_text_to_jsonb("event_faqs", "answer")


def downgrade() -> None:
    conn = op.get_bind()

    for table, column in [("events", "description"), ("event_faqs", "answer")]:
        tmp_col = f"{column}_text"
        op.execute(f'ALTER TABLE {table} ADD COLUMN "{tmp_col}" TEXT')

        rows = conn.execute(sa_text(f'SELECT id, {column} FROM {table}')).fetchall()
        for row in rows:
            raw = row[1]
            if raw is not None:
                if isinstance(raw, dict):
                    text_content = _extract_text(raw)
                else:
                    text_content = str(raw)
                conn.execute(
                    sa_text(f'UPDATE {table} SET "{tmp_col}" = :val WHERE id = :id'),
                    {"val": text_content, "id": row[0]},
                )

        op.execute(f'ALTER TABLE {table} DROP COLUMN {column}')
        op.execute(f'ALTER TABLE {table} RENAME COLUMN "{tmp_col}" TO {column}')


def _extract_text(node: dict) -> str:
    """Recursively extract plain text from TipTap JSON."""
    parts: list[str] = []
    if "text" in node:
        parts.append(node["text"])
    for child in node.get("content", []):
        parts.append(_extract_text(child))
    return " ".join(parts).strip()
