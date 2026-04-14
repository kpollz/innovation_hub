"""Problem SQLAlchemy model."""
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Column, ForeignKey, String, Table, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.models.base import BaseModel

if TYPE_CHECKING:
    from app.infrastructure.database.models.user_model import UserModel
    from app.infrastructure.database.models.room_model import RoomModel
    from app.infrastructure.database.models.comment_model import CommentModel

# Association table for problem shared users (many-to-many)
problem_shared_users = Table(
    "problem_shared_users",
    BaseModel.metadata,
    Column("problem_id", PGUUID(as_uuid=False), ForeignKey("problems.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", PGUUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)


class ProblemModel(BaseModel):
    """Problem ORM model."""
    
    __tablename__ = "problems"
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="open")
    visibility: Mapped[str] = mapped_column(String(20), default="public", nullable=False)
    author_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Relationships
    author: Mapped["UserModel"] = relationship("UserModel", back_populates="problems")
    room: Mapped[Optional["RoomModel"]] = relationship(
        "RoomModel",
        back_populates="problem",
        uselist=False
    )
    comments: Mapped[List["CommentModel"]] = relationship(
        "CommentModel",
        back_populates="problem",
        foreign_keys="CommentModel.target_id",
        primaryjoin="and_(ProblemModel.id==CommentModel.target_id, "
                    "CommentModel.target_type=='problem')",
        viewonly=True
    )
    shared_users: Mapped[List["UserModel"]] = relationship(
        "UserModel",
        secondary=problem_shared_users,
        back_populates="shared_problems",
        lazy="selectin",
    )