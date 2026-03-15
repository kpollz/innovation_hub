"""Reset admin user password."""
import asyncio
import sys
sys.path.insert(0, '/app')

from sqlalchemy import text
from app.infrastructure.database.config import get_async_session_maker
from app.infrastructure.security.password import PasswordHasher


async def reset_password():
    session_maker = get_async_session_maker()
    hasher = PasswordHasher()
    
    new_password = "admin123"
    password_hash = hasher.hash(new_password)
    
    async with session_maker() as session:
        await session.execute(
            text("UPDATE users SET password_hash = :hash WHERE username = 'admin'"),
            {"hash": password_hash}
        )
        await session.commit()
        print(f"Password reset for admin to: {new_password}")
        print(f"Hash: {password_hash}")


if __name__ == "__main__":
    asyncio.run(reset_password())