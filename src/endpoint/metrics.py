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
    current_ist = datetime.now(zoneinfo.ZoneInfo("Asia/Kolkata"))
    current_hour_floor = current_ist.hour
    today_ist = current_ist.date()

    data = await db.scalars(
        select(StockMetrics).where(
            func.date(StockMetrics.created_at) == today_ist,
            func.extract("hour", StockMetrics.created_at) >= current_hour_floor,
        )
    )
    return data.all()
