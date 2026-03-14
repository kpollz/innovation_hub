"""Refresh token use case."""
from uuid import UUID

from app.application.services.jwt_service import JWTService
from app.domain.repositories.user_repository import UserRepository
from app.core.exceptions import UnauthorizedException


class RefreshTokenUseCase:
    """Use case: Refresh access token."""
    
    def __init__(
        self,
        user_repo: UserRepository,
        jwt_service: JWTService
    ):
        self.user_repo = user_repo
        self.jwt_service = jwt_service
    
    async def execute(
        self,
        refresh_token: str
    ) -> tuple[str, str]:
        """
        Execute the use case.
        
        Returns:
            Tuple of (new_access_token, new_refresh_token)
        """
        try:
            # Decode refresh token
            payload = self.jwt_service.decode_token(refresh_token, token_type="refresh")
            user_id = UUID(payload["sub"])
            
            # Verify user exists
            user = await self.user_repo.get_by_id(user_id)
            if not user or not user.is_active:
                raise UnauthorizedException("Invalid refresh token")
            
            # Generate new tokens
            new_access_token = self.jwt_service.create_access_token(
                user_id=user.id,
                username=user.username,
                role=user.role.value
            )
            new_refresh_token = self.jwt_service.create_refresh_token(
                user_id=user.id
            )
            
            return new_access_token, new_refresh_token
            
        except Exception:
            raise UnauthorizedException("Invalid refresh token")
