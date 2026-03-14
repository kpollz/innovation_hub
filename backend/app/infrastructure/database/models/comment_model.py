"""Comment SQLAlchemy model."""
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.models.base import BaseModel

if TYPE_CHECKING:
    from app.infrastructure.database.models.user_model import UserModel
    from app.infrastructure.database.models.problem_model import ProblemModel
    from app.infrastructure.database.models.idea_model import IdeaModel


class CommentModel(BaseModel):
    """Comment ORM model."""
    
    __tablename__ = "comments"
    
    target_id: Mapped[str] = mapped_column(PGUUID(as_uuid=False), nullable=False)
    target_type: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    author_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    parent_id: Mapped[Optional[str]] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("comments.id", ondelete="CASCADE"),
        nullable=True
    )
    
    # Relationships
    author: Mapped["UserModel"] = relationship("UserModel", back_populates="comments")
    problem: Mapped[Optional["ProblemModel"]] = relationship(
        "ProblemModel",
        back_populates="comments",
        foreign_keys="CommentModel.target_id",
        primaryjoin="and_(CommentModel.target_id==ProblemModel.id, "
                    "CommentModel.target_type=='problem')"
    )
    idea: Mapped[Optional["IdeaModel"]] = relationship(
        "IdeaModel",
        back_populates="comments",
        foreign_keys="CommentModel.target_id",
        primaryjoin="and_(CommentModel.target_id==IdeaModel.id, "
                    "CommentModel.target_type=='idea')"
    )
    parent: Mapped[Optional["CommentModel"]] = relationship(
        "CommentModel",
        remote_side="CommentModel.id",
        back_populates="replies"
    )
    replies: Mapped[List["CommentModel"]] = relationship(
        "CommentModel",
        back_populates="parent",
        cascade="all, delete-orphan"
    )
