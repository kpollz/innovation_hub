"""EventAward SQLAlchemy models."""
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.models.base import BaseModel

if TYPE_CHECKING:
    from app.infrastructure.database.models.event_model import EventModel
    from app.infrastructure.database.models.event_team_model import EventTeamModel


class EventAwardModel(BaseModel):
    """EventAward ORM model."""

    __tablename__ = "event_awards"

    event_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    rank_order: Mapped[int] = mapped_column(Integer, nullable=False)

    event: Mapped["EventModel"] = relationship("EventModel")


class EventAwardTeamModel(BaseModel):
    """EventAwardTeam junction ORM model."""

    __tablename__ = "event_award_teams"
    __table_args__ = (
        UniqueConstraint("award_id", "team_id", name="uq_award_team"),
    )

    award_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("event_awards.id", ondelete="CASCADE"),
        nullable=False,
    )
    team_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("event_teams.id", ondelete="CASCADE"),
        nullable=False,
    )

    award: Mapped["EventAwardModel"] = relationship("EventAwardModel")
    team: Mapped["EventTeamModel"] = relationship("EventTeamModel")
