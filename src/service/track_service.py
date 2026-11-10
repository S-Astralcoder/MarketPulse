from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select

from src.database import AsyncSession, Stock, TrackStock


async def add_stock_track(symbol: str, user_id: UUID, db: AsyncSession):
    if not await db.scalar(select(Stock).where(Stock.symbol == symbol)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The stock symbol doesn't exist",
        )

    track_instance = TrackStock(user_uuid=user_id, stock_symbol=symbol)
    db.add(track_instance)


async def remove_stock_track(symbol: str, user_id: UUID, db: AsyncSession):
    track = await db.scalar(
        select(TrackStock).where(
            TrackStock.user_uuid == user_id, TrackStock.stock_symbol == symbol
        )
    )
    if track:
        await db.delete(track)
        return True
    return False
