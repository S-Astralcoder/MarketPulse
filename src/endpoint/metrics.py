from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import StockMetrics, get_db

metrics = APIRouter(prefix="/metric", tags=["metric"])


@metrics.get("/")
async def get_market_metrics(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    lastest_date = await db.scalar(
        select(StockMetrics.created_at).order_by(StockMetrics.created_at.desc())
    )
    if lastest_date is None:
        return
    data = await db.scalars(
        select(StockMetrics).where(StockMetrics.created_at >= lastest_date)
    )
    return data.all()
