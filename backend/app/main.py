"""FastAPI application entry point."""
import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.infrastructure.database.config import DatabaseConfig
from app.infrastructure.database.models.base import BaseModel
from app.infrastructure.web.api.v1.router import api_router

settings = get_settings()

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s %(levelname)-5s [%(name)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    stream=sys.stdout,
)
# Silence noisy loggers
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)
logging.getLogger("uvicorn.access").setLevel(logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    db_config = DatabaseConfig(settings)
    app.state.db_config = db_config
    
    # Setup JWT service for authentication
    from app.application.services.jwt_service import JWTService
    app.state.jwt_service = JWTService()

    # Setup Agent proxy service
    from app.application.services.agent_proxy_service import AgentProxyService
    app.state.agent_proxy_service = AgentProxyService()
    
    # Create tables (for development - use Alembic in production)
    if settings.env == "development":
        async with db_config.engine.begin() as conn:
            await conn.run_sync(BaseModel.metadata.create_all)
    
    yield
    
    # Shutdown
    await app.state.agent_proxy_service.close()
    await db_config.close()


def create_application() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Innovation Hub API - Problem Feed & Brainstorming Platform",
        lifespan=lifespan,
        debug=settings.debug
    )
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=settings.cors_allow_methods,
        allow_headers=settings.cors_allow_headers,
    )
    
    # Global exception handler for domain/app exceptions
    from app.core.exceptions import AppException

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message},
        )

    # Include routers
    app.include_router(api_router, prefix="/api")
    
    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {"status": "healthy", "version": settings.app_version}
    
    @app.get("/")
    async def root():
        """Root endpoint."""
        return {
            "name": settings.app_name,
            "version": settings.app_version,
            "docs": "/docs"
        }
    
    return app


app = create_application()
