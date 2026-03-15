"""Script to add summary column to problems table."""
import asyncio
from sqlalchemy import text
from app.infrastructure.database.config import get_async_engine


async def main():
    engine = get_async_engine()
    async with engine.begin() as conn:
        await conn.execute(text('ALTER TABLE problems ADD COLUMN IF NOT EXISTS summary VARCHAR(500)'))
    print('Successfully added summary column to problems table')


if __name__ == '__main__':
    asyncio.run(main())