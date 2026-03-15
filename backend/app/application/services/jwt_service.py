"""JWT service for token management."""
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from jose import jwt, JWTError

from app.core.config import get_settings
from app.core.exceptions import UnauthorizedException

settings = get_settings()


class JWTService:
    """Service for JWT token operations."""
    
    def __init__(self):
        self.secret_key = settings.jwt_secret
        self.algorithm = settings.jwt_algorithm
        self.access_expire_minutes = settings.jwt_access_token_expire_minutes
        self.refresh_expire_days = settings.jwt_refresh_token_expire_days
    
    def create_access_token(
        self,
        user_id: UUID,
        username: str,
        role: str,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create a new access token."""
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_expire_minutes)
        
        to_encode = {
            "sub": str(user_id),
            "username": username,
            "role": role,
            "exp": expire,
            "type": "access"
        }
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
    
    def create_refresh_token(
        self,
        user_id: UUID,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create a new refresh token."""
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(days=self.refresh_expire_days)
        
        to_encode = {
            "sub": str(user_id),
            "exp": expire,
            "type": "refresh"
        }
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
    
    def decode_token(self, token: str, token_type: str = "access") -> dict:
        """Decode and verify a token."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            
            if payload.get("type") != token_type:
                raise UnauthorizedException(f"Invalid token type, expected {token_type}")
            
            return payload
        except JWTError:
            raise UnauthorizedException("Invalid or expired token")
    
    def get_user_id_from_token(self, token: str) -> UUID:
        """Extract user ID from token."""
        payload = self.decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedException("Token missing user ID")
        return UUID(user_id)
    
    def verify_token(self, token: str) -> dict:
        """Verify and decode an access token."""
        return self.decode_token(token, token_type="access")
