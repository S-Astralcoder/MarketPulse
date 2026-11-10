from collections.abc import AsyncGenerator
from datetime import datetime
from uuid import UUID, uuid4
from zoneinfo import ZoneInfo

from pydantic import EmailStr
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    Integer,
    MetaData,
    String,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from src.model import RiskLevel, RsiMovementStatus, Trend, VolitilityStatus

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
        except Exception:
            await session.rollback()
            raise
        else:
            await session.close()


convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=convention)


class User(Base):
    __tablename__ = "user"

    uuid: Mapped[UUID] = mapped_column(
        Uuid, default=uuid4, primary_key=True, nullable=False
    )

    google_id: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True
    )
    picture_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    username: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[EmailStr] = mapped_column(String(254), unique=True, nullable=False)
    hash_password: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (UniqueConstraint("username", "email"),)


class Stock(Base):
    __tablename__ = "stock"

    uuid: Mapped[UUID] = mapped_column(
        Uuid, default=uuid4, primary_key=True, nullable=False
    )
    symbol: Mapped[String] = mapped_column(String, nullable=False, unique=True)
    name: Mapped[String] = mapped_column(String, nullable=False, unique=True)
    sector: Mapped[String] = mapped_column(String, nullable=False)
    is_active: Mapped[Boolean] = mapped_column(Boolean, default=True, nullable=False)


def get_ist_time():
    return datetime.now(ZoneInfo("Asia/Kolkata"))


class StockMetrics(Base):
    __tablename__ = "metrics"
    uuid: Mapped[UUID] = mapped_column(
        Uuid, default=uuid4, primary_key=True, nullable=False
    )
    symbol: Mapped[String] = mapped_column(String, nullable=False)
    name: Mapped[String] = mapped_column(String, nullable=False)
    price_change: Mapped[float] = mapped_column(
        Float, nullable=False
    )  # price difference compared to last price check
    close_price: Mapped[float] = mapped_column(Float, nullable=False)

    risk_score: Mapped[Integer] = mapped_column(
        Integer,
        CheckConstraint("risk_score >= 0 AND risk_score <= 100", name="score check"),
        nullable=False,
    )
    risk_level: Mapped[RiskLevel] = mapped_column(nullable=False)

    rsi: Mapped[float] = mapped_column(Float, nullable=False)
    movement_status: Mapped[RsiMovementStatus] = mapped_column(nullable=False)

    atr: Mapped[float] = mapped_column(Float, nullable=False)
    natr: Mapped[float] = mapped_column(Float, nullable=False)
    atr_ratio: Mapped[float] = mapped_column(Float, nullable=False)
    volatility_status: Mapped[VolitilityStatus] = mapped_column(nullable=False)

    ema_fast: Mapped[int] = mapped_column(Integer, nullable=False)
    ema_slow: Mapped[int] = mapped_column(Integer, nullable=False)
    trend_direction: Mapped[Trend] = mapped_column(nullable=False)

    adx: Mapped[int] = mapped_column(Integer, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=get_ist_time
    )
