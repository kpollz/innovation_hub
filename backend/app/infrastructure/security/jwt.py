"""JWT authentication utilities for FastAPI."""
from typing import List
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.application.dto.user_dto import UserResponseDTO
from app.application.services.jwt_service import JWTService
from app.infrastructure.database.repositories.user_repository_impl import SQLUserRepository

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    request: Request = None
) -> UserResponseDTO:
    """Get current authenticated user from JWT token."""
    try:
        # Get jwt_service from app state
        jwt_service: JWTService = request.app.state.jwt_service
        
        # Create user repository with db session from request state
        from app.infrastructure.database.config import DatabaseConfig
        db_config: DatabaseConfig = request.app.state.db_config
        
        async with db_config.session_maker() as session:
            user_repo = SQLUserRepository(session)
            
            payload = jwt_service.decode_token(credentials.credentials)
            user_id = UUID(payload["sub"])
            
            user = await user_repo.get_by_id(user_id)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found"
                )
            
            return UserResponseDTO.model_validate(user)
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}"
        )


async def get_current_active_user(
    current_user: UserResponseDTO = Depends(get_current_user)
) -> UserResponseDTO:
    """Get current active user."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


class RoleChecker:
    """Dependency for checking user roles."""
    
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles
    
    def __call__(self, user: UserResponseDTO = Depends(get_current_active_user)) -> UserResponseDTO:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return user


require_admin = RoleChecker(["admin"])
