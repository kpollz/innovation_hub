"""SQLAlchemy implementation of IdeaRepository."""
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.idea import Idea
from app.domain.repositories.idea_repository import IdeaRepository
from app.domain.value_objects.status import IdeaStatus
from app.infrastructure.database.models.idea_model import IdeaModel


class SQLIdeaRepository(IdeaRepository):
    """SQLAlchemy implementation of IdeaRepository."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _to_entity(self, model: IdeaModel) -> Idea:
        """Map ORM model to domain entity."""
        return Idea(
            id=UUID(model.id),
            room_id=UUID(model.room_id),
            title=model.title,
            description=model.description,
            summary=model.summary,
            status=IdeaStatus(model.status),
            author_id=UUID(model.author_id),
            is_pinned=model.is_pinned,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    def _to_model(self, entity: Idea) -> IdeaModel:
        """Map domain entity to ORM model."""
        return IdeaModel(
            id=str(entity.id),
            room_id=str(entity.room_id),
            title=entity.title,
            description=entity.description,
            summary=entity.summary,
            status=entity.status.value,
            author_id=str(entity.author_id),
            is_pinned=entity.is_pinned,
            created_at=entity.created_at,
            updated_at=entity.updated_at
        )
    
    async def get_by_id(self, idea_id: UUID) -> Optional[Idea]:
        result = await self.session.execute(
            select(IdeaModel).where(IdeaModel.id == str(idea_id))
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None
    
    async def list(
        self,
        filters: Optional[dict] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Idea], int]:
        query = select(IdeaModel)
        
        # Apply filters
        if filters:
            if filters.get("room_id"):
                query = query.where(IdeaModel.room_id == str(filters["room_id"]))
            if filters.get("author_id"):
                query = query.where(IdeaModel.author_id == str(filters["author_id"]))
            if filters.get("status"):
                query = query.where(IdeaModel.status == filters["status"])
            if filters.get("created_after"):
                query = query.where(IdeaModel.created_at >= filters["created_after"])
            if filters.get("created_before"):
                query = query.where(IdeaModel.created_at < filters["created_before"])
            if filters.get("search"):
                search = f"%{filters['search']}%"
                query = query.where(
                    (IdeaModel.title.ilike(search)) |
                    (IdeaModel.description.ilike(search))
                )
        
        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.session.scalar(count_query)
        
        # Pagination - pinned first, then by created_at
        query = query.offset((page - 1) * limit).limit(limit)
        query = query.order_by(IdeaModel.is_pinned.desc(), IdeaModel.created_at.desc())
        
        result = await self.session.execute(query)
        models = result.scalars().all()
        
        return [self._to_entity(m) for m in models], total
    
    async def list_by_room_id(
        self,
        room_id: UUID,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Idea], int]:
        return await self.list(
            filters={"room_id": room_id},
            page=page,
            limit=limit
        )
    
    async def list_by_author_id(
        self,
        author_id: UUID,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Idea], int]:
        return await self.list(
            filters={"author_id": author_id},
            page=page,
            limit=limit
        )
    
    async def create(self, idea: Idea) -> Idea:
        model = self._to_model(idea)
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)
    
    async def update(self, idea: Idea) -> Idea:
        model = await self.session.get(IdeaModel, str(idea.id))
        if not model:
            raise ValueError(f"Idea {idea.id} not found")
        
        model.title = idea.title
        model.description = idea.description
        model.summary = idea.summary
        model.status = idea.status.value
        model.is_pinned = idea.is_pinned
        model.updated_at = idea.updated_at
        
        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)
    
    async def delete(self, idea_id: UUID) -> bool:
        model = await self.session.get(IdeaModel, str(idea_id))
        if not model:
            return False
        
        await self.session.delete(model)
        await self.session.flush()
        return True
