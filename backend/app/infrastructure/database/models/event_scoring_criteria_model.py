"""EventScoringCriteria SQLAlchemy model."""
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.models.base import BaseModel

if TYPE_CHECKING:
    from app.infrastructure.database.models.event_model import EventModel


class EventScoringCriteriaModel(BaseModel):
    __tablename__ = "event_scoring_criteria"

    event_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
    )
    group: Mapped[str] = mapped_column(String(20), nullable=False)  # problem | solution
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    weight: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    max_score: Mapped[float] = mapped_column(Float, default=12.5, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    event: Mapped["EventModel"] = relationship("EventModel")
