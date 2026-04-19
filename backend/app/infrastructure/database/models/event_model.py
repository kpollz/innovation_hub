"""Event SQLAlchemy model."""
from datetime import date, datetime
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import Date, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.models.base import BaseModel

if TYPE_CHECKING:
    from app.infrastructure.database.models.user_model import UserModel
    from app.infrastructure.database.models.event_team_model import EventTeamModel


class EventModel(BaseModel):
    """Event ORM model."""

    __tablename__ = "events"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    introduction_type: Mapped[str] = mapped_column(
        String(20), default="editor", nullable=False
    )
    embed_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_by: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    closed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    creator: Mapped["UserModel"] = relationship("UserModel", back_populates="events")
    teams: Mapped[list["EventTeamModel"]] = relationship(
        "EventTeamModel", back_populates="event", cascade="all, delete-orphan"
    )
