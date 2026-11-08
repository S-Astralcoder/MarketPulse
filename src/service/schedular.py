from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import FastAPI

from src.config import get_config_settings
from src.service.update_metrics import update_market_metrics

schedular = AsyncIOScheduler()

config = get_config_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    schedular.add_job(
        update_market_metrics,
        trigger=CronTrigger(
            timezone="Asia/Kolkata",
            second=config.CORN_JOB_SECOND,
            minute=config.CORN_JOB_MINUTE,
            hour=config.CORN_JOB_HOUR,
            day=config.CORN_JOB_DAY,
        ),
    )
    schedular.start()
    yield
    schedular.shutdown()
