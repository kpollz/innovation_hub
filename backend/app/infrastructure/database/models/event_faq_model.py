"""EventFAQ SQLAlchemy model."""
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.models.base import BaseModel

if TYPE_CHECKING:
    from app.infrastructure.database.models.event_model import EventModel
    from app.infrastructure.database.models.user_model import UserModel


class EventFAQModel(BaseModel):
    """EventFAQ ORM model."""

    __tablename__ = "event_faqs"

    event_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_by: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    event: Mapped["EventModel"] = relationship("EventModel")
    creator: Mapped["UserModel"] = relationship("UserModel", foreign_keys=[created_by])
