"""SQLAlchemy implementation of ProblemRepository."""
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select, desc, asc, or_, Text as SQLText, cast
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.problem import Problem
from app.domain.repositories.problem_repository import ProblemRepository
from app.domain.value_objects.category import ProblemCategory
from app.domain.value_objects.visibility import Visibility
from app.infrastructure.database.models.reaction_model import ReactionModel
from app.infrastructure.database.models.comment_model import CommentModel
from app.domain.value_objects.status import ProblemStatus
from app.infrastructure.database.models.problem_model import ProblemModel, problem_shared_users


class SQLProblemRepository(ProblemRepository):
    """SQLAlchemy implementation of ProblemRepository."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _to_entity(self, model: ProblemModel) -> Problem:
        """Map ORM model to domain entity."""
        # Extract shared user IDs from the relationship
        shared_ids = [UUID(u.id) for u in model.shared_users] if model.shared_users else []
        return Problem(
            id=UUID(model.id),
            title=model.title,
            summary=model.summary,
            content=model.content,
            category=ProblemCategory(model.category),
            author_id=UUID(model.author_id),
            status=ProblemStatus(model.status),
            visibility=Visibility(model.visibility),
            shared_user_ids=shared_ids,
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
            visibility=entity.visibility.value,
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
            if filters.get("created_after"):
                query = query.where(ProblemModel.created_at >= filters["created_after"])
            if filters.get("created_before"):
                query = query.where(ProblemModel.created_at < filters["created_before"])
            if filters.get("search"):
                search = f"%{filters['search']}%"
                query = query.where(
                    (ProblemModel.title.ilike(search)) |
                    (cast(ProblemModel.content, SQLText).ilike(search))
                )
            # Privacy filter: only show problems the user can see
            current_user_id = filters.get("current_user_id")
            is_admin = filters.get("is_admin", False)
            if current_user_id and not is_admin:
                # Public problems OR (private AND (author OR shared with user))
                shared_subquery = (
                    select(problem_shared_users.c.problem_id)
                    .where(problem_shared_users.c.user_id == str(current_user_id))
                )
                query = query.where(
                    or_(
                        ProblemModel.visibility == Visibility.PUBLIC.value,
                        ProblemModel.author_id == str(current_user_id),
                        ProblemModel.id.in_(shared_subquery),
                    )
                )
        
        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.session.scalar(count_query)
        
        # Sorting
        sort = filters.get("sort") if filters else None
        if sort == "oldest":
            query = query.order_by(asc(ProblemModel.created_at))
        elif sort == "most_liked":
            # Left join reactions where target_type='problem' and type='like'
            like_count = (
                select(
                    ReactionModel.target_id,
                    func.count().label("like_count")
                )
                .where(ReactionModel.target_type == "problem")
                .group_by(ReactionModel.target_id)
                .subquery()
            )
            query = query.outerjoin(
                like_count, ProblemModel.id == like_count.c.target_id
            ).order_by(desc(func.coalesce(like_count.c.like_count, 0)), desc(ProblemModel.created_at))
        elif sort == "most_commented":
            comment_count = (
                select(
                    CommentModel.target_id,
                    func.count().label("comment_count")
                )
                .where(CommentModel.target_type == "problem")
                .group_by(CommentModel.target_id)
                .subquery()
            )
            query = query.outerjoin(
                comment_count, ProblemModel.id == comment_count.c.target_id
            ).order_by(desc(func.coalesce(comment_count.c.comment_count, 0)), desc(ProblemModel.created_at))
        else:
            query = query.order_by(desc(ProblemModel.created_at))

        # Pagination
        query = query.offset((page - 1) * limit).limit(limit)
        
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
        # Save shared users to association table
        if problem.shared_user_ids:
            from sqlalchemy import insert
            await self.session.execute(
                insert(problem_shared_users).values([
                    {"problem_id": str(problem.id), "user_id": str(uid)}
                    for uid in problem.shared_user_ids
                ])
            )
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
        model.visibility = problem.visibility.value
        model.updated_at = problem.updated_at
        
        # Update shared users
        # First clear existing shared users
        await self.session.execute(
            problem_shared_users.delete().where(
                problem_shared_users.c.problem_id == str(problem.id)
            )
        )
        # Then add new shared users
        if problem.shared_user_ids:
            from sqlalchemy import insert
            await self.session.execute(
                insert(problem_shared_users).values([
                    {"problem_id": str(problem.id), "user_id": str(uid)}
                    for uid in problem.shared_user_ids
                ])
            )
        
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
