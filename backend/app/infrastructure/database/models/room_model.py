"""Room SQLAlchemy model."""
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.models.base import BaseModel

if TYPE_CHECKING:
    from app.infrastructure.database.models.user_model import UserModel
    from app.infrastructure.database.models.problem_model import ProblemModel
    from app.infrastructure.database.models.idea_model import IdeaModel


class RoomModel(BaseModel):
    """Room ORM model."""
    
    __tablename__ = "rooms"
    
    __table_args__ = (
        UniqueConstraint("problem_id", name="uq_room_problem"),
    )
    
    problem_id: Mapped[Optional[str]] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("problems.id", ondelete="SET NULL"),
        nullable=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    status: Mapped[str] = mapped_column(String(30), default="active")
    
    # Relationships
    problem: Mapped[Optional["ProblemModel"]] = relationship(
        "ProblemModel",
        back_populates="room"
    )
    creator: Mapped["UserModel"] = relationship("UserModel", back_populates="rooms")
    ideas: Mapped[List["IdeaModel"]] = relationship(
        "IdeaModel",
        back_populates="room",
        cascade="all, delete-orphan"
    )
