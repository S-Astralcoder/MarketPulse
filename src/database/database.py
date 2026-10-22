from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

async_engine = create_async_engine(
    url="sqlite+aiosqlite:///./database.db", echo=True, pool_per_ping=True
)

AsyncSessionFactory = async_sessionmaker(
    bind=async_engine, expire_on_commit=False, class_=AsyncSession
)


async def get_db() -> AsyncGenerator[AsyncSession]:
    async with AsyncSessionFactory() as session:
        yield session


class Base(DeclarativeBase):
    pass
