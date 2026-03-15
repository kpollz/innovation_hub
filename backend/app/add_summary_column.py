"""Script to add summary column to problems table."""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import get_settings


async def main():
    settings = get_settings()
    engine = create_async_engine(str(settings.database_url), echo=True)
    async with engine.begin() as conn:
        await conn.execute(text('ALTER TABLE problems ADD COLUMN IF NOT EXISTS summary VARCHAR(500)'))
    print('Successfully added summary column to problems table')
    await engine.dispose()


if __name__ == '__main__':
    asyncio.run(main())