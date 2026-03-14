"""SQLAlchemy implementation of CommentRepository."""
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.comment import Comment
from app.domain.repositories.comment_repository import CommentRepository
from app.infrastructure.database.models.comment_model import CommentModel


class SQLCommentRepository(CommentRepository):
    """SQLAlchemy implementation of CommentRepository."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _to_entity(self, model: CommentModel) -> Comment:
        """Map ORM model to domain entity."""
        return Comment(
            id=UUID(model.id),
            target_id=UUID(model.target_id),
            target_type=model.target_type,
            content=model.content,
            author_id=UUID(model.author_id),
            parent_id=UUID(model.parent_id) if model.parent_id else None,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    def _to_model(self, entity: Comment) -> CommentModel:
        """Map domain entity to ORM model."""
        return CommentModel(
            id=str(entity.id),
            target_id=str(entity.target_id),
            target_type=entity.target_type,
            content=entity.content,
            author_id=str(entity.author_id),
            parent_id=str(entity.parent_id) if entity.parent_id else None,
            created_at=entity.created_at,
            updated_at=entity.updated_at
        )
    
    async def get_by_id(self, comment_id: UUID) -> Optional[Comment]:
        result = await self.session.execute(
            select(CommentModel).where(CommentModel.id == str(comment_id))
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None
    
    async def list_by_target(
        self,
        target_id: UUID,
        target_type: str,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Comment], int]:
        query = select(CommentModel).where(
            (CommentModel.target_id == str(target_id)) &
            (CommentModel.target_type == target_type) &
            (CommentModel.parent_id.is_(None))  # Only root comments
        )
        
        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.session.scalar(count_query)
        
        # Pagination
        query = query.offset((page - 1) * limit).limit(limit)
        query = query.order_by(CommentModel.created_at.desc())
        
        result = await self.session.execute(query)
        models = result.scalars().all()
        
        return [self._to_entity(m) for m in models], total
    
    async def list_replies(
        self,
        parent_id: UUID,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Comment], int]:
        query = select(CommentModel).where(
            CommentModel.parent_id == str(parent_id)
        )
        
        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.session.scalar(count_query)
        
        # Pagination
        query = query.offset((page - 1) * limit).limit(limit)
        query = query.order_by(CommentModel.created_at.asc())
        
        result = await self.session.execute(query)
        models = result.scalars().all()
        
        return [self._to_entity(m) for m in models], total
    
    async def create(self, comment: Comment) -> Comment:
        model = self._to_model(comment)
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)
    
    async def update(self, comment: Comment) -> Comment:
        model = await self.session.get(CommentModel, str(comment.id))
        if not model:
            raise ValueError(f"Comment {comment.id} not found")
        
        model.content = comment.content
        model.updated_at = comment.updated_at
        
        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)
    
    async def delete(self, comment_id: UUID) -> bool:
        model = await self.session.get(CommentModel, str(comment_id))
        if not model:
            return False
        
        await self.session.delete(model)
        await self.session.flush()
        return True
    
    async def delete_by_target(self, target_id: UUID, target_type: str) -> bool:
        result = await self.session.execute(
            select(CommentModel).where(
                (CommentModel.target_id == str(target_id)) &
                (CommentModel.target_type == target_type)
            )
        )
        models = result.scalars().all()
        
        for model in models:
            await self.session.delete(model)
        
        await self.session.flush()
        return True
