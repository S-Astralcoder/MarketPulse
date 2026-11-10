from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import StockMetrics, TrackStock, User, get_db
from src.service.user_security import get_signed_in_user

metrics = APIRouter(prefix="/metric", tags=["metric"])


@metrics.post("/")
async def get_market_metrics(
    db: Annotated[AsyncSession, Depends(get_db)],
    user_data: Annotated[User, Depends(get_signed_in_user)],
):
    latest_date = await db.scalar(
        select(StockMetrics.created_at).order_by(StockMetrics.created_at.desc())
    )
    if latest_date is None:
        return
    data = await db.scalars(
        select(StockMetrics).where(StockMetrics.created_at >= latest_date)
    )
    return data.all()


@metrics.post("/tracked")
async def get_tracked_metrics(
    db: Annotated[AsyncSession, Depends(get_db)],
    user_data: Annotated[User, Depends(get_signed_in_user)],
):
    latest_date = await db.scalar(
        select(StockMetrics.created_at).order_by(StockMetrics.created_at.desc())
    )
    if latest_date is None:
        return
    data = await db.scalars(
        select(StockMetrics)
        .join(TrackStock, TrackStock.stock_symbol == StockMetrics.symbol)
        .where(StockMetrics.created_at >= latest_date)
    )
    return data.all()
