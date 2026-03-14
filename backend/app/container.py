"""Dependency Injection Container using dependency-injector."""
from dependency_injector import containers, providers

from app.core.config import get_settings
from app.infrastructure.database.config import DatabaseConfig
from app.infrastructure.security.password import PasswordHasher
from app.application.services.jwt_service import JWTService


class Container(containers.DeclarativeContainer):
    """Application container for dependency injection."""
    
    # Configuration
    config = providers.Configuration()
    
    # Core services
    settings = providers.Singleton(get_settings)
    
    # Database
    db_config = providers.Singleton(
        DatabaseConfig,
        settings=settings
    )
    
    # Security
    password_hasher = providers.Singleton(PasswordHasher)
    jwt_service = providers.Singleton(JWTService)


def init_container() -> Container:
    """Initialize and wire the container."""
    container = Container()
    container.wire(
        modules=[
            "app.infrastructure.web.api.deps",
            "app.infrastructure.web.api.v1.endpoints.auth",
            "app.infrastructure.web.api.v1.endpoints.problems",
            "app.infrastructure.web.api.v1.endpoints.rooms",
            "app.infrastructure.web.api.v1.endpoints.ideas",
            "app.infrastructure.web.api.v1.endpoints.comments",
            "app.infrastructure.web.api.v1.endpoints.users",
        ]
    )
    return container
