"""SQLAlchemy implementation of ReactionRepository."""
from typing import Dict, List, Optional, Tuple
from uuid import UUID

from sqlalchemy import distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.reaction import Reaction, ReactionType
from app.domain.repositories.reaction_repository import ReactionRepository
from app.infrastructure.database.models.reaction_model import ReactionModel


class SQLReactionRepository(ReactionRepository):
    """SQLAlchemy implementation of ReactionRepository."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _to_entity(self, model: ReactionModel) -> Reaction:
        """Map ORM model to domain entity."""
        return Reaction(
            id=UUID(model.id),
            target_id=UUID(model.target_id),
            target_type=model.target_type,
            type=ReactionType(model.type),
            user_id=UUID(model.user_id),
            created_at=model.created_at
        )
    
    def _to_model(self, entity: Reaction) -> ReactionModel:
        """Map domain entity to ORM model."""
        return ReactionModel(
            id=str(entity.id),
            target_id=str(entity.target_id),
            target_type=entity.target_type,
            type=entity.type.value,
            user_id=str(entity.user_id),
            created_at=entity.created_at
        )
    
    async def get_by_id(self, reaction_id: UUID) -> Optional[Reaction]:
        result = await self.session.execute(
            select(ReactionModel).where(ReactionModel.id == str(reaction_id))
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None
    
    async def get_by_user_and_target(
        self,
        user_id: UUID,
        target_id: UUID,
        target_type: str
    ) -> Optional[Reaction]:
        result = await self.session.execute(
            select(ReactionModel).where(
                (ReactionModel.user_id == str(user_id)) &
                (ReactionModel.target_id == str(target_id)) &
                (ReactionModel.target_type == target_type)
            )
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None
    
    async def list_by_target(
        self,
        target_id: UUID,
        target_type: str,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Reaction], int]:
        query = select(ReactionModel).where(
            (ReactionModel.target_id == str(target_id)) &
            (ReactionModel.target_type == target_type)
        )
        
        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.session.scalar(count_query)
        
        # Pagination
        query = query.offset((page - 1) * limit).limit(limit)
        query = query.order_by(ReactionModel.created_at.desc())
        
        result = await self.session.execute(query)
        models = result.scalars().all()
        
        return [self._to_entity(m) for m in models], total
    
    async def count_by_type(
        self,
        target_id: UUID,
        target_type: str,
        reaction_type: ReactionType
    ) -> int:
        result = await self.session.execute(
            select(func.count()).where(
                (ReactionModel.target_id == str(target_id)) &
                (ReactionModel.target_type == target_type) &
                (ReactionModel.type == reaction_type.value)
            )
        )
        return result.scalar() or 0
    
    async def get_counts_by_target(
        self,
        target_id: UUID,
        target_type: str
    ) -> Dict[ReactionType, int]:
        result = await self.session.execute(
            select(ReactionModel.type, func.count()).where(
                (ReactionModel.target_id == str(target_id)) &
                (ReactionModel.target_type == target_type)
            ).group_by(ReactionModel.type)
        )
        
        counts = {rt: 0 for rt in ReactionType}
        for row in result.all():
            reaction_type = ReactionType(row[0])
            counts[reaction_type] = row[1]
        
        return counts
    
    async def create(self, reaction: Reaction) -> Reaction:
        model = self._to_model(reaction)
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        await self.session.commit()
        return self._to_entity(model)
    
    async def update(self, reaction: Reaction) -> Reaction:
        model = await self.session.get(ReactionModel, str(reaction.id))
        if not model:
            raise ValueError(f"Reaction {reaction.id} not found")
        
        model.type = reaction.type.value
        
        await self.session.flush()
        await self.session.refresh(model)
        await self.session.commit()
        return self._to_entity(model)

    async def delete(self, reaction_id: UUID) -> bool:
        model = await self.session.get(ReactionModel, str(reaction_id))
        if not model:
            return False
        
        await self.session.delete(model)
        await self.session.flush()
        await self.session.commit()
        return True

    async def delete_by_target(self, target_id: UUID, target_type: str) -> bool:
        result = await self.session.execute(
            select(ReactionModel).where(
                (ReactionModel.target_id == str(target_id)) &
                (ReactionModel.target_type == target_type)
            )
        )
        models = result.scalars().all()

        for model in models:
            await self.session.delete(model)

        await self.session.flush()
        await self.session.commit()
        return True

    async def list_distinct_users_by_target(
        self, target_id: UUID, target_type: str
    ) -> List[UUID]:
        result = await self.session.execute(
            select(distinct(ReactionModel.user_id)).where(
                (ReactionModel.target_id == str(target_id))
                & (ReactionModel.target_type == target_type)
            )
        )
        return [UUID(row) for row in result.scalars().all()]
