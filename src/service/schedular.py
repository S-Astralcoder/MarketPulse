from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import FastAPI

from service.update_metrics import update_market_metrics

schedular = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    schedular.add_job(func=update_market_metrics, trigger=CronTrigger(minute=0))
    schedular.start()
    yield
    schedular.shutdown()
