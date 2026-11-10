import zoneinfo
from datetime import datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import StockMetrics, get_db
from src.model import RiskLevel

metrics = APIRouter(prefix="/metric", tags=["metric"])


@metrics.get("/")
async def get_market_metrics(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    lastest_date = await db.scalar(
        select(StockMetrics.created_at).order_by(StockMetrics.created_at.desc())
    )
    data = await db.scalars(
        select(StockMetrics).where(StockMetrics.created_at >= lastest_date)
    )
    return data.all()
