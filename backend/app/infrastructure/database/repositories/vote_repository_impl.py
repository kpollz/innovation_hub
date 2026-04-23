"""SQLAlchemy implementation of VoteRepository."""
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.vote import Vote
from app.domain.repositories.vote_repository import VoteRepository
from app.infrastructure.database.models.vote_model import VoteModel


class SQLVoteRepository(VoteRepository):
    """SQLAlchemy implementation of VoteRepository."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _to_entity(self, model: VoteModel) -> Vote:
        """Map ORM model to domain entity."""
        return Vote(
            id=UUID(model.id),
            idea_id=UUID(model.idea_id),
            user_id=UUID(model.user_id),
            stars=model.stars,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    def _to_model(self, entity: Vote) -> VoteModel:
        """Map domain entity to ORM model."""
        return VoteModel(
            id=str(entity.id),
            idea_id=str(entity.idea_id),
            user_id=str(entity.user_id),
            stars=entity.stars,
            created_at=entity.created_at,
            updated_at=entity.updated_at
        )
    
    async def get_by_id(self, vote_id: UUID) -> Optional[Vote]:
        result = await self.session.execute(
            select(VoteModel).where(VoteModel.id == str(vote_id))
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None
    
    async def get_by_user_and_idea(
        self,
        user_id: UUID,
        idea_id: UUID
    ) -> Optional[Vote]:
        result = await self.session.execute(
            select(VoteModel).where(
                (VoteModel.user_id == str(user_id)) &
                (VoteModel.idea_id == str(idea_id))
            )
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None
    
    async def list_by_idea(
        self,
        idea_id: UUID,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Vote], int]:
        query = select(VoteModel).where(VoteModel.idea_id == str(idea_id))
        
        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.session.scalar(count_query)
        
        # Pagination
        query = query.offset((page - 1) * limit).limit(limit)
        query = query.order_by(VoteModel.created_at.desc())
        
        result = await self.session.execute(query)
        models = result.scalars().all()
        
        return [self._to_entity(m) for m in models], total
    
    async def get_average_stars(self, idea_id: UUID) -> float:
        result = await self.session.execute(
            select(func.avg(VoteModel.stars)).where(
                VoteModel.idea_id == str(idea_id)
            )
        )
        avg = result.scalar()
        return float(avg) if avg else 0.0
    
    async def get_vote_count(self, idea_id: UUID) -> int:
        result = await self.session.execute(
            select(func.count()).where(VoteModel.idea_id == str(idea_id))
        )
        return result.scalar() or 0
    
    async def create(self, vote: Vote) -> Vote:
        model = self._to_model(vote)
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        await self.session.commit()
        return self._to_entity(model)
    
    async def update(self, vote: Vote) -> Vote:
        model = await self.session.get(VoteModel, str(vote.id))
        if not model:
            raise ValueError(f"Vote {vote.id} not found")
        
        model.stars = vote.stars
        model.updated_at = vote.updated_at
        
        await self.session.flush()
        await self.session.refresh(model)
        await self.session.commit()
        return self._to_entity(model)

    async def delete(self, vote_id: UUID) -> bool:
        model = await self.session.get(VoteModel, str(vote_id))
        if not model:
            return False
        
        await self.session.delete(model)
        await self.session.flush()
        await self.session.commit()
        return True

    async def delete_by_idea(self, idea_id: UUID) -> bool:
        result = await self.session.execute(
            select(VoteModel).where(VoteModel.idea_id == str(idea_id))
        )
        models = result.scalars().all()

        for model in models:
            await self.session.delete(model)

        await self.session.flush()
        await self.session.commit()
        return True

    async def list_distinct_users_by_idea(self, idea_id: UUID) -> List[UUID]:
        result = await self.session.execute(
            select(distinct(VoteModel.user_id)).where(
                VoteModel.idea_id == str(idea_id)
            )
        )
        return [UUID(row) for row in result.scalars().all()]
