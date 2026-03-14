"""FastAPI dependencies."""
from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.services.jwt_service import JWTService
from app.infrastructure.database.config import DatabaseConfig
from app.infrastructure.database.repositories.user_repository_impl import SQLUserRepository
from app.infrastructure.database.repositories.problem_repository_impl import SQLProblemRepository
from app.infrastructure.database.repositories.room_repository_impl import SQLRoomRepository
from app.infrastructure.database.repositories.idea_repository_impl import SQLIdeaRepository
from app.infrastructure.database.repositories.comment_repository_impl import SQLCommentRepository
from app.infrastructure.database.repositories.vote_repository_impl import SQLVoteRepository
from app.infrastructure.database.repositories.reaction_repository_impl import SQLReactionRepository
from app.infrastructure.security.password import PasswordHasher


async def get_db_session(request: Request) -> AsyncSession:
    """Get database session from request state."""
    db_config: DatabaseConfig = request.app.state.db_config
    async with db_config.session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def get_user_repo(session: AsyncSession = Depends(get_db_session)) -> SQLUserRepository:
    return SQLUserRepository(session)


def get_problem_repo(session: AsyncSession = Depends(get_db_session)) -> SQLProblemRepository:
    return SQLProblemRepository(session)


def get_room_repo(session: AsyncSession = Depends(get_db_session)) -> SQLRoomRepository:
    return SQLRoomRepository(session)


def get_idea_repo(session: AsyncSession = Depends(get_db_session)) -> SQLIdeaRepository:
    return SQLIdeaRepository(session)


def get_comment_repo(session: AsyncSession = Depends(get_db_session)) -> SQLCommentRepository:
    return SQLCommentRepository(session)


def get_vote_repo(session: AsyncSession = Depends(get_db_session)) -> SQLVoteRepository:
    return SQLVoteRepository(session)


def get_reaction_repo(session: AsyncSession = Depends(get_db_session)) -> SQLReactionRepository:
    return SQLReactionRepository(session)


def get_password_hasher() -> PasswordHasher:
    return PasswordHasher()


def get_jwt_service() -> JWTService:
    return JWTService()
