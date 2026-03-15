#!/usr/bin/env python3
"""Debug script to test login functionality."""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.core.config import get_settings
from app.infrastructure.database.models.user_model import UserModel
from app.infrastructure.security.password import PasswordHasher


async def debug_login(username: str = "admin", password: str = "abc13579"):
    """Debug login to find the issue."""
    settings = get_settings()
    
    # Create engine and session
    engine = create_async_engine(
        str(settings.database_url),
        echo=False
    )
    async_session_factory = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    async with async_session_factory() as session:
        try:
            # 1. Get user from database
            print(f"\n🔍 Step 1: Looking for user '{username}'...")
            result = await session.execute(
                select(UserModel).where(UserModel.username == username)
            )
            user = result.scalar_one_or_none()
            
            if not user:
                print(f"❌ User '{username}' not found in database!")
                return False
            
            print(f"✅ User found:")
            print(f"   ID: {user.id}")
            print(f"   Username: {user.username}")
            print(f"   Email: {user.email}")
            print(f"   Role: {user.role}")
            print(f"   Is Active: {user.is_active}")
            print(f"   Password Hash: {user.password_hash[:50]}...")
            
            # 2. Test password verification
            print(f"\n🔍 Step 2: Verifying password...")
            print(f"   Input password: {password}")
            
            password_hasher = PasswordHasher()
            
            # Verify
            is_valid = password_hasher.verify(password, user.password_hash)
            print(f"   Verification result: {is_valid}")
            
            if is_valid:
                print(f"\n✅ Password is CORRECT!")
            else:
                print(f"\n❌ Password is INCORRECT!")
                
                # Try to understand why
                print(f"\n🔍 Step 3: Debug password hashing...")
                
                # Hash the password again and compare
                new_hash = password_hasher.hash(password)
                print(f"   New hash for '{password}': {new_hash[:50]}...")
                
                # Verify new hash works
                new_verify = password_hasher.verify(password, new_hash)
                print(f"   New hash verification: {new_verify}")
                
                # Check if stored hash can be verified at all
                print(f"\n🔍 Step 4: Check stored hash integrity...")
                try:
                    # Try with passlib directly
                    from passlib.context import CryptContext
                    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
                    direct_verify = pwd_context.verify(password, user.password_hash)
                    print(f"   Direct passlib verification: {direct_verify}")
                except Exception as e:
                    print(f"   ❌ Error with direct passlib: {e}")
            
            return is_valid
            
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            await engine.dispose()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Debug login")
    parser.add_argument("--username", default="admin", help="Username to test")
    parser.add_argument("--password", default="abc13579", help="Password to test")
    
    args = parser.parse_args()
    
    asyncio.run(debug_login(args.username, args.password))