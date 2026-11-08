from sqlalchemy import select

from src.database import AsyncSessionFactory, Stock


async def fetch_and_calculate_market_metrics():
    async with AsyncSessionFactory() as session:
        stock_symbols = await session.scalars(
            select(Stock.symbol).where(Stock.is_active == True)
        )
        print(stock_symbols)
