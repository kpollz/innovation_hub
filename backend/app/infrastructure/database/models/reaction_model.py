"""Reaction SQLAlchemy model."""
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.models.base import BaseModel

if TYPE_CHECKING:
    from app.infrastructure.database.models.user_model import UserModel


class ReactionModel(BaseModel):
    """Reaction ORM model."""
    
    __tablename__ = "reactions"
    
    __table_args__ = (
        UniqueConstraint("target_id", "target_type", "user_id", 
                        name="uq_reaction_target_user"),
    )
    
    target_id: Mapped[str] = mapped_column(PGUUID(as_uuid=False), nullable=False)
    target_type: Mapped[str] = mapped_column(String(20), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    user_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Relationships
    user: Mapped["UserModel"] = relationship("UserModel", back_populates="reactions")
