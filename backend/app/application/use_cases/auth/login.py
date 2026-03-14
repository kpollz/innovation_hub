"""Login use case."""
from app.application.dto.user_dto import UserResponseDTO
from app.application.services.jwt_service import JWTService
from app.domain.repositories.user_repository import UserRepository
from app.infrastructure.security.password import PasswordHasher
from app.core.exceptions import UnauthorizedException


class LoginUseCase:
    """Use case: User login."""
    
    def __init__(
        self,
        user_repo: UserRepository,
        password_hasher: PasswordHasher,
        jwt_service: JWTService
    ):
        self.user_repo = user_repo
        self.password_hasher = password_hasher
        self.jwt_service = jwt_service
    
    async def execute(
        self,
        username: str,
        password: str
    ) -> tuple[UserResponseDTO, str, str]:
        """
        Execute the use case.
        
        Returns:
            Tuple of (UserResponseDTO, access_token, refresh_token)
        """
        # Get user by username
        user = await self.user_repo.get_by_username(username)
        if not user:
            raise UnauthorizedException("Invalid username or password")
        
        # Check if user is active
        if not user.is_active:
            raise UnauthorizedException("Account is deactivated")
        
        # Verify password
        if not self.password_hasher.verify(password, user.password_hash):
            raise UnauthorizedException("Invalid username or password")
        
        # Generate tokens
        access_token = self.jwt_service.create_access_token(
            user_id=user.id,
            username=user.username,
            role=user.role.value
        )
        refresh_token = self.jwt_service.create_refresh_token(
            user_id=user.id
        )
        
        # Return as DTO
        return UserResponseDTO.model_validate(user), access_token, refresh_token
