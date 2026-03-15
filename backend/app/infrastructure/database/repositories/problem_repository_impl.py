"""SQLAlchemy implementation of ProblemRepository."""
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.problem import Problem
from app.domain.repositories.problem_repository import ProblemRepository
from app.domain.value_objects.category import ProblemCategory
from app.domain.value_objects.status import ProblemStatus
from app.infrastructure.database.models.problem_model import ProblemModel


class SQLProblemRepository(ProblemRepository):
    """SQLAlchemy implementation of ProblemRepository."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _to_entity(self, model: ProblemModel) -> Problem:
        """Map ORM model to domain entity."""
        # room_id is accessed via relationship (Room has problem_id, not Problem has room_id)
        # Set to None here - can be loaded separately if needed
        return Problem(
            id=UUID(model.id),
            title=model.title,
            summary=model.summary,
            content=model.content,
            category=ProblemCategory(model.category),
            author_id=UUID(model.author_id),
            status=ProblemStatus(model.status),
            created_at=model.created_at,
            updated_at=model.updated_at,
            room_id=None  # Problem doesn't have room_id column; Room has problem_id
        )
    
    def _to_model(self, entity: Problem) -> ProblemModel:
        """Map domain entity to ORM model."""
        return ProblemModel(
            id=str(entity.id),
            title=entity.title,
            summary=entity.summary,
            content=entity.content,
            category=entity.category.value,
            status=entity.status.value,
            author_id=str(entity.author_id),
            created_at=entity.created_at,
            updated_at=entity.updated_at
        )
    
    async def get_by_id(self, problem_id: UUID) -> Optional[Problem]:
        result = await self.session.execute(
            select(ProblemModel).where(ProblemModel.id == str(problem_id))
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None
    
    async def list(
        self,
        filters: Optional[dict] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Problem], int]:
        query = select(ProblemModel)
        
        # Apply filters
        if filters:
            if filters.get("status"):
                query = query.where(ProblemModel.status == filters["status"])
            if filters.get("category"):
                query = query.where(ProblemModel.category == filters["category"])
            if filters.get("author_id"):
                query = query.where(ProblemModel.author_id == str(filters["author_id"]))
            if filters.get("search"):
                search = f"%{filters['search']}%"
                query = query.where(
                    (ProblemModel.title.ilike(search)) |
                    (ProblemModel.content.ilike(search))
                )
        
        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.session.scalar(count_query)
        
        # Pagination
        query = query.offset((page - 1) * limit).limit(limit)
        query = query.order_by(ProblemModel.created_at.desc())
        
        result = await self.session.execute(query)
        models = result.scalars().all()
        
        return [self._to_entity(m) for m in models], total
    
    async def get_by_room_id(self, room_id: UUID) -> Optional[Problem]:
        from app.infrastructure.database.models.room_model import RoomModel
        result = await self.session.execute(
            select(RoomModel).where(RoomModel.id == str(room_id))
        )
        room = result.scalar_one_or_none()
        if room and room.problem_id:
            return await self.get_by_id(UUID(room.problem_id))
        return None
    
    async def create(self, problem: Problem) -> Problem:
        model = self._to_model(problem)
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)
    
    async def update(self, problem: Problem) -> Problem:
        model = await self.session.get(ProblemModel, str(problem.id))
        if not model:
            raise ValueError(f"Problem {problem.id} not found")
        
        model.title = problem.title
        model.summary = problem.summary
        model.content = problem.content
        model.category = problem.category.value
        model.status = problem.status.value
        model.updated_at = problem.updated_at
        
        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)
    
    async def delete(self, problem_id: UUID) -> bool:
        model = await self.session.get(ProblemModel, str(problem_id))
        if not model:
            return False
        
        await self.session.delete(model)
        await self.session.flush()
        return True
