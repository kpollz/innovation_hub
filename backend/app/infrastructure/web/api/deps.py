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


async def get_current_user(
    request: Request,
    user_repo: SQLUserRepository = Depends(get_user_repo),
    jwt_service: JWTService = Depends(get_jwt_service)
):
    """Get current user from JWT token in Authorization header."""
    from fastapi import HTTPException, status
    
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    token = auth_header.replace("Bearer ", "")
    try:
        payload = jwt_service.verify_token(token)
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )
    
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user
