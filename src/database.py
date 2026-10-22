from collections.abc import AsyncGenerator
from datetime import datetime
from uuid import UUID, uuid4

from pydantic import EmailStr
from sqlalchemy import DateTime, String, UniqueConstraint, Uuid, func
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

async_engine = create_async_engine(
    url="sqlite+aiosqlite:///./database.db", echo=True, pool_pre_ping=True
)

AsyncSessionFactory = async_sessionmaker(
    bind=async_engine, expire_on_commit=False, class_=AsyncSession
)


async def get_db() -> AsyncGenerator[AsyncSession]:
    async with AsyncSessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:  # noqa: BLE001
            await session.rollback()
        else:
            await session.close()


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "user"

    uuid: Mapped[UUID] = mapped_column(
        Uuid, default=uuid4, primary_key=True, nullable=False
    )
    username: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[EmailStr] = mapped_column(String(254), unique=True, nullable=False)
    hash_password: Mapped[str] = mapped_column(String(100), nullable=False)
    created_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (UniqueConstraint("username", "email"),)
