"""Authentication endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.application.dto.user_dto import CreateUserDTO, UserResponseDTO
from app.application.services.jwt_service import JWTService
from app.application.use_cases.auth.register import RegisterUseCase
from app.application.use_cases.auth.login import LoginUseCase
from app.application.use_cases.auth.refresh_token import RefreshTokenUseCase
from app.infrastructure.database.repositories.user_repository_impl import SQLUserRepository
from app.infrastructure.security.password import PasswordHasher
from app.infrastructure.security.jwt import get_current_active_user
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


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: CreateUserDTO,
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
    password_hasher: PasswordHasher = Depends(deps.get_password_hasher),
    jwt_service: JWTService = Depends(deps.get_jwt_service),
):
    """Register a new user."""
    use_case = RegisterUseCase(user_repo, password_hasher, jwt_service)
    try:
        user, access_token, refresh_token = await use_case.execute(data)
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
    password_hasher: PasswordHasher = Depends(deps.get_password_hasher),
    jwt_service: JWTService = Depends(deps.get_jwt_service),
):
    """Login with username and password."""
    use_case = LoginUseCase(user_repo, password_hasher, jwt_service)
    try:
        user, access_token, refresh_token = await use_case.execute(
            data.username, data.password
        )
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )


@router.get("/me", response_model=UserResponseDTO)
async def get_current_user_info(
    current_user=Depends(deps.get_current_user),
):
    """Get current authenticated user."""
    return UserResponseDTO.model_validate(current_user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    data: RefreshRequest,
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
    jwt_service: JWTService = Depends(deps.get_jwt_service),
):
    """Refresh access token using refresh token."""
    try:
        # Decode refresh token to get user_id
        payload = jwt_service.decode_token(data.refresh_token, token_type="refresh")
        from uuid import UUID
        user_id = UUID(payload["sub"])

        # Fetch actual user
        user = await user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        # Generate new tokens
        new_access_token = jwt_service.create_access_token(
            user_id=user.id,
            username=user.username,
            role=user.role.value,
        )
        new_refresh_token = jwt_service.create_refresh_token(user_id=user.id)

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            user=UserResponseDTO.model_validate(user),
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )


@router.put("/password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    user_repo: SQLUserRepository = Depends(deps.get_user_repo),
    password_hasher: PasswordHasher = Depends(deps.get_password_hasher),
):
    """Change current user's password."""
    user = await user_repo.get_by_id(current_user.id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Verify old password
    if not password_hasher.verify(data.old_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    # Update password
    user.password_hash = password_hasher.hash(data.new_password)
    await user_repo.update(user)

    return {"message": "Password updated successfully"}
