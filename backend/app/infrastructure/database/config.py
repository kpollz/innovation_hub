"""Database configuration."""
from typing import Optional

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import Settings


class DatabaseConfig:
    """Database configuration and engine factory."""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self._engine: Optional[AsyncEngine] = None
        self._session_maker: Optional[async_sessionmaker[AsyncSession]] = None
    
    @property
    def engine(self) -> AsyncEngine:
        """Get or create async engine."""
        if self._engine is None:
            self._engine = create_async_engine(
                str(self.settings.database_url),
                echo=False,
                pool_size=self.settings.db_pool_size,
                max_overflow=self.settings.db_max_overflow,
                pool_pre_ping=self.settings.db_pool_pre_ping,
            )
        return self._engine
    
    @property
    def session_maker(self) -> async_sessionmaker[AsyncSession]:
        """Get or create session maker."""
        if self._session_maker is None:
            self._session_maker = async_sessionmaker(
                self.engine,
                class_=AsyncSession,
                expire_on_commit=False,
                autoflush=False,
            )
        return self._session_maker
    
    async def close(self) -> None:
        """Close database connections."""
        if self._engine:
            await self._engine.dispose()
            self._engine = None
