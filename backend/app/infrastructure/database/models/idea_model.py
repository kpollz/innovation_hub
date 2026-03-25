"""Idea SQLAlchemy model."""
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.models.base import BaseModel

if TYPE_CHECKING:
    from app.infrastructure.database.models.user_model import UserModel
    from app.infrastructure.database.models.room_model import RoomModel
    from app.infrastructure.database.models.comment_model import CommentModel
    from app.infrastructure.database.models.vote_model import VoteModel


class IdeaModel(BaseModel):
    """Idea ORM model."""
    
    __tablename__ = "ideas"
    
    room_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("rooms.id", ondelete="CASCADE"),
        nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="draft")
    author_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationships
    room: Mapped["RoomModel"] = relationship("RoomModel", back_populates="ideas")
    author: Mapped["UserModel"] = relationship("UserModel", back_populates="ideas")
    comments: Mapped[List["CommentModel"]] = relationship(
        "CommentModel",
        back_populates="idea",
        foreign_keys="CommentModel.target_id",
        primaryjoin="and_(IdeaModel.id==CommentModel.target_id, "
                    "CommentModel.target_type=='idea')",
        viewonly=True
    )
    votes: Mapped[List["VoteModel"]] = relationship(
        "VoteModel",
        back_populates="idea",
        cascade="all, delete-orphan"
    )
