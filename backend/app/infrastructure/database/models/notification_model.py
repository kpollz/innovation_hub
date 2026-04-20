"""Notification SQLAlchemy model."""
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.models.base import BaseModel

if TYPE_CHECKING:
    from app.infrastructure.database.models.user_model import UserModel


class NotificationModel(BaseModel):
    """Notification ORM model."""

    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notifications_user_unread", "user_id", "is_read", "created_at"),
    )

    user_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    actor_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    type: Mapped[str] = mapped_column(String(30), nullable=False)
    target_id: Mapped[str] = mapped_column(PGUUID(as_uuid=False), nullable=False)
    target_type: Mapped[str] = mapped_column(String(20), nullable=False)
    target_title: Mapped[str] = mapped_column(String(300), nullable=False)
    action_detail: Mapped[str | None] = mapped_column(String(100), nullable=True)
    reference_id: Mapped[str | None] = mapped_column(PGUUID(as_uuid=False), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    user: Mapped["UserModel"] = relationship(
        "UserModel",
        foreign_keys=[user_id],
    )
    actor: Mapped["UserModel"] = relationship(
        "UserModel",
        foreign_keys=[actor_id],
    )
