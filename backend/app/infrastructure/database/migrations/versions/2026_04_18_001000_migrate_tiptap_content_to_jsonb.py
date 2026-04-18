"""Migrate ideas.description and problems.content from TEXT to JSONB

Revision ID: migrate_tiptap_to_jsonb
Revises: add_event_faqs_table
Create Date: 2026-04-18 10:00:00.000000
"""
from alembic import op
from sqlalchemy import text as sa_text

from app.application.use_cases.event_idea.html_to_tiptap import html_to_tiptap
import json

revision = "migrate_tiptap_to_jsonb"
down_revision = "add_event_faqs_table"
branch_labels = None
depends_on = None


def _migrate_text_to_jsonb(table: str, column: str) -> None:
    """Read TEXT rows, convert HTML→TipTap JSON, write back as JSONB."""
    conn = op.get_bind()

    # Add a temporary JSONB column
    tmp_col = f"{column}_jsonb"
    op.execute(f'ALTER TABLE {table} ADD COLUMN "{tmp_col}" JSONB')

    # Read existing text data
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

    # Drop old column, rename temp to original name
    op.execute(f'ALTER TABLE {table} DROP COLUMN {column}')
    op.execute(f'ALTER TABLE {table} RENAME COLUMN "{tmp_col}" TO {column}')

    # Set NOT NULL where needed
    if table == "ideas" and column == "description":
        op.execute(f'ALTER TABLE {table} ALTER COLUMN {column} SET NOT NULL')
    elif table == "problems" and column == "content":
        op.execute(f'ALTER TABLE {table} ALTER COLUMN {column} SET NOT NULL')


def upgrade() -> None:
    _migrate_text_to_jsonb("ideas", "description")
    _migrate_text_to_jsonb("problems", "content")


def downgrade() -> None:
    # NOTE: Downgrade converts JSONB back to TEXT, losing TipTap structure → HTML conversion
    # This is a best-effort downgrade; some formatting may be lost.
    conn = op.get_bind()

    for table, column in [("ideas", "description"), ("problems", "content")]:
        tmp_col = f"{column}_text"
        op.execute(f'ALTER TABLE {table} ADD COLUMN "{tmp_col}" TEXT')

        rows = conn.execute(sa_text(f'SELECT id, {column} FROM {table}')).fetchall()
        for row in rows:
            raw = row[1]
            if raw is not None:
                # JSONB comes back as dict; extract text content
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

        if table == "ideas" and column == "description":
            op.execute(f'ALTER TABLE {table} ALTER COLUMN {column} SET NOT NULL')
        elif table == "problems" and column == "content":
            op.execute(f'ALTER TABLE {table} ALTER COLUMN {column} SET NOT NULL')


def _extract_text(node: dict) -> str:
    """Recursively extract plain text from TipTap JSON."""
    parts: list[str] = []
    if "text" in node:
        parts.append(node["text"])
    for child in node.get("content", []):
        parts.append(_extract_text(child))
    return " ".join(parts).strip()
