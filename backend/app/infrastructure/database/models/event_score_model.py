"""EventScore SQLAlchemy model."""
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Float, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.models.base import BaseModel

if TYPE_CHECKING:
    from app.infrastructure.database.models.event_idea_model import EventIdeaModel
    from app.infrastructure.database.models.event_team_model import EventTeamModel


class EventScoreModel(BaseModel):
    __tablename__ = "event_scores"
    __table_args__ = (
        UniqueConstraint("event_idea_id", "scorer_team_id", name="uq_event_score_team"),
    )

    event_idea_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("event_ideas.id", ondelete="CASCADE"),
        nullable=False,
    )
    scorer_team_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("event_teams.id", ondelete="CASCADE"),
        nullable=False,
    )
    criteria_scores: Mapped[dict] = mapped_column(JSONB, nullable=False)
    criteria_notes: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    total_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    idea: Mapped["EventIdeaModel"] = relationship("EventIdeaModel")
    scorer_team: Mapped["EventTeamModel"] = relationship("EventTeamModel")
