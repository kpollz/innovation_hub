"""Authentication endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.application.dto.user_dto import CreateUserDTO, UserResponseDTO
from app.application.services.jwt_service import JWTService
from app.application.use_cases.auth.register import RegisterUseCase
from app.application.use_cases.auth.login import LoginUseCase
from app.application.use_cases.auth.refresh_token import RefreshTokenUseCase
from app.infrastructure.database.repositories.user_repository_impl import SQLUserRepository
from app.infrastructure.security.password import PasswordHasher
from app.infrastructure.web.api import deps

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponseDTO


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: CreateUserDTO,
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
    password_hasher: PasswordHasher = Depends(deps.get_password_hasher),
    jwt_service: JWTService = Depends(deps.get_jwt_service)
):
    """Register a new user."""
    use_case = RegisterUseCase(user_repo, password_hasher, jwt_service)
    
    try:
        user, access_token, refresh_token = await use_case.execute(data)
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
    password_hasher: PasswordHasher = Depends(deps.get_password_hasher),
    jwt_service: JWTService = Depends(deps.get_jwt_service)
):
    """Login with username and password."""
    use_case = LoginUseCase(user_repo, password_hasher, jwt_service)
    
    try:
        user, access_token, refresh_token = await use_case.execute(
            data.username,
            data.password
        )
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user
        )
    except Exception as e:
        # Log the actual error for debugging
        import traceback
        print(f"❌ Login error: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid credentials: {str(e)}"
        )


@router.get("/me", response_model=UserResponseDTO)
async def get_current_user_info(
    current_user = Depends(deps.get_current_user)
):
    """Get current authenticated user."""
    return UserResponseDTO.model_validate(current_user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    data: RefreshRequest,
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
    jwt_service: JWTService = Depends(deps.get_jwt_service)
):
    """Refresh access token using refresh token."""
    use_case = RefreshTokenUseCase(user_repo, jwt_service)
    
    try:
        access_token, refresh_token = await use_case.execute(data.refresh_token)
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponseDTO(id="", username="", role="member", is_active=True, created_at=None)  # Placeholder
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
