"""Database session management."""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.config import DatabaseConfig


class AsyncSessionManager:
    """Manages async database sessions."""
    
    def __init__(self, db_config: DatabaseConfig):
        self.db_config = db_config
    
    @asynccontextmanager
    async def session(self) -> AsyncGenerator[AsyncSession, None]:
        """Provide a transactional scope around a series of operations."""
        session = self.db_config.session_maker()
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_async_session(
    db_config: DatabaseConfig
) -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for getting async session."""
    async with db_config.session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
