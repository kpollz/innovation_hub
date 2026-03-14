"""Vote SQLAlchemy model."""
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.models.base import BaseModel

if TYPE_CHECKING:
    from app.infrastructure.database.models.user_model import UserModel
    from app.infrastructure.database.models.idea_model import IdeaModel


class VoteModel(BaseModel):
    """Vote ORM model."""
    
    __tablename__ = "votes"
    
    __table_args__ = (
        UniqueConstraint("idea_id", "user_id", name="uq_vote_idea_user"),
        CheckConstraint("stars BETWEEN 1 AND 5", name="check_stars_range"),
    )
    
    idea_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("ideas.id", ondelete="CASCADE"),
        nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    stars: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Relationships
    idea: Mapped["IdeaModel"] = relationship("IdeaModel", back_populates="votes")
    user: Mapped["UserModel"] = relationship("UserModel", back_populates="votes")
