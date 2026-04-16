"""EventTeam and EventTeamMember SQLAlchemy models."""
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.models.base import BaseModel

if TYPE_CHECKING:
    from app.infrastructure.database.models.event_model import EventModel
    from app.infrastructure.database.models.user_model import UserModel


class EventTeamModel(BaseModel):
    """EventTeam ORM model."""

    __tablename__ = "event_teams"

    event_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slogan: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    leader_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    assigned_to_team_id: Mapped[Optional[str]] = mapped_column(
        PGUUID(as_uuid=False), nullable=True
    )

    # Relationships
    event: Mapped["EventModel"] = relationship("EventModel", back_populates="teams")
    leader: Mapped["UserModel"] = relationship("UserModel", foreign_keys=[leader_id])
    members: Mapped[List["EventTeamMemberModel"]] = relationship(
        "EventTeamMemberModel", back_populates="team", cascade="all, delete-orphan"
    )


class EventTeamMemberModel(BaseModel):
    """EventTeamMember ORM model."""

    __tablename__ = "event_team_members"
    __table_args__ = (
        UniqueConstraint("user_id", "event_id", name="uq_user_event_team"),
    )

    team_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("event_teams.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    event_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    # Relationships
    team: Mapped["EventTeamModel"] = relationship("EventTeamModel", back_populates="members")
    user: Mapped["UserModel"] = relationship("UserModel", foreign_keys=[user_id])
