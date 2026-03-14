"""SQLAlchemy implementation of RoomRepository."""
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.room import Room
from app.domain.repositories.room_repository import RoomRepository
from app.domain.value_objects.status import RoomStatus
from app.infrastructure.database.models.room_model import RoomModel


class SQLRoomRepository(RoomRepository):
    """SQLAlchemy implementation of RoomRepository."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _to_entity(self, model: RoomModel) -> Room:
        """Map ORM model to domain entity."""
        return Room(
            id=UUID(model.id),
            name=model.name,
            description=model.description,
            problem_id=UUID(model.problem_id) if model.problem_id else None,
            created_by=UUID(model.created_by),
            status=RoomStatus(model.status),
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    def _to_model(self, entity: Room) -> RoomModel:
        """Map domain entity to ORM model."""
        return RoomModel(
            id=str(entity.id),
            name=entity.name,
            description=entity.description,
            problem_id=str(entity.problem_id) if entity.problem_id else None,
            created_by=str(entity.created_by),
            status=entity.status.value,
            created_at=entity.created_at,
            updated_at=entity.updated_at
        )
    
    async def get_by_id(self, room_id: UUID) -> Optional[Room]:
        result = await self.session.execute(
            select(RoomModel).where(RoomModel.id == str(room_id))
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None
    
    async def list(
        self,
        filters: Optional[dict] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Room], int]:
        query = select(RoomModel)
        
        # Apply filters
        if filters:
            if filters.get("status"):
                query = query.where(RoomModel.status == filters["status"])
            if filters.get("problem_id"):
                query = query.where(RoomModel.problem_id == str(filters["problem_id"]))
            if filters.get("created_by"):
                query = query.where(RoomModel.created_by == str(filters["created_by"]))
            if filters.get("search"):
                search = f"%{filters['search']}%"
                query = query.where(
                    (RoomModel.name.ilike(search)) |
                    (RoomModel.description.ilike(search))
                )
        
        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.session.scalar(count_query)
        
        # Pagination
        query = query.offset((page - 1) * limit).limit(limit)
        query = query.order_by(RoomModel.created_at.desc())
        
        result = await self.session.execute(query)
        models = result.scalars().all()
        
        return [self._to_entity(m) for m in models], total
    
    async def get_by_problem_id(self, problem_id: UUID) -> Optional[Room]:
        result = await self.session.execute(
            select(RoomModel).where(RoomModel.problem_id == str(problem_id))
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None
    
    async def create(self, room: Room) -> Room:
        model = self._to_model(room)
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)
    
    async def update(self, room: Room) -> Room:
        model = await self.session.get(RoomModel, str(room.id))
        if not model:
            raise ValueError(f"Room {room.id} not found")
        
        model.name = room.name
        model.description = room.description
        model.status = room.status.value
        model.updated_at = room.updated_at
        
        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)
    
    async def delete(self, room_id: UUID) -> bool:
        model = await self.session.get(RoomModel, str(room_id))
        if not model:
            return False
        
        await self.session.delete(model)
        await self.session.flush()
        return True
