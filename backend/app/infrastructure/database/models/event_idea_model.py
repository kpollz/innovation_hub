"""EventIdea SQLAlchemy model."""
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.models.base import BaseModel

if TYPE_CHECKING:
    from app.infrastructure.database.models.event_model import EventModel
    from app.infrastructure.database.models.event_team_model import EventTeamModel
    from app.infrastructure.database.models.user_model import UserModel


class EventIdeaModel(BaseModel):
    """EventIdea ORM model."""

    __tablename__ = "event_ideas"

    event_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
    )
    team_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("event_teams.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    user_problem: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    user_scenarios: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    user_expectation: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    research: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    solution: Mapped[dict] = mapped_column(JSONB, nullable=False)
    source_type: Mapped[str] = mapped_column(
        String(20), default="manual", nullable=False
    )
    source_problem_id: Mapped[Optional[str]] = mapped_column(PGUUID(as_uuid=False), nullable=True)
    source_room_id: Mapped[Optional[str]] = mapped_column(PGUUID(as_uuid=False), nullable=True)
    source_idea_id: Mapped[Optional[str]] = mapped_column(PGUUID(as_uuid=False), nullable=True)
    author_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Relationships
    event: Mapped["EventModel"] = relationship("EventModel")
    team: Mapped["EventTeamModel"] = relationship("EventTeamModel")
    author: Mapped["UserModel"] = relationship("UserModel", foreign_keys=[author_id])
