import asyncio

from src.service.update_metrics import update_market_metrics


async def main():
    await update_market_metrics()


asyncio.run(main())
