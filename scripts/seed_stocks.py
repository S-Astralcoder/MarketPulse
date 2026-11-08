import asyncio
from uuid import uuid4

from sqlalchemy import select

from src.database import AsyncSessionFactory, Stock

TOP_INDIAN_STOCKS = [
    {
        "symbol": "RELIANCE.NS",
        "name": "Reliance Industries Limited",
        "sector": "Energy",
        "is_active": True,
    },
    {
        "symbol": "TCS.NS",
        "name": "Tata Consultancy Services Limited",
        "sector": "Information Technology",
        "is_active": True,
    },
    {
        "symbol": "HDFCBANK.NS",
        "name": "HDFC Bank Limited",
        "sector": "Financial Services",
        "is_active": True,
    },
    {
        "symbol": "BHARTIARTL.NS",
        "name": "Bharti Airtel Limited",
        "sector": "Telecommunication",
        "is_active": True,
    },
    {
        "symbol": "ICICIBANK.NS",
        "name": "ICICI Bank Limited",
        "sector": "Financial Services",
        "is_active": True,
    },
    {
        "symbol": "INFY.NS",
        "name": "Infosys Limited",
        "sector": "Information Technology",
        "is_active": True,
    },
    {
        "symbol": "SBIN.NS",
        "name": "State Bank of India",
        "sector": "Financial Services",
        "is_active": True,
    },
    {
        "symbol": "ITC.NS",
        "name": "ITC Limited",
        "sector": "Consumer Goods",
        "is_active": True,
    },
    {
        "symbol": "HINDUNILVR.NS",
        "name": "Hindustan Unilever Limited",
        "sector": "Consumer Goods",
        "is_active": True,
    },
    {
        "symbol": "LT.NS",
        "name": "Larsen & Toubro Limited",
        "sector": "Construction & Engineering",
        "is_active": True,
    },
    {
        "symbol": "BAJFINANCE.NS",
        "name": "Bajaj Finance Limited",
        "sector": "Financial Services",
        "is_active": True,
    },
    {
        "symbol": "HCLTECH.NS",
        "name": "HCL Technologies Limited",
        "sector": "Information Technology",
        "is_active": True,
    },
    {
        "symbol": "KOTAKBANK.NS",
        "name": "Kotak Mahindra Bank Limited",
        "sector": "Financial Services",
        "is_active": True,
    },
    {
        "symbol": "AXISBANK.NS",
        "name": "Axis Bank Limited",
        "sector": "Financial Services",
        "is_active": True,
    },
    {
        "symbol": "SUNPHARMA.NS",
        "name": "Sun Pharmaceutical Industries Limited",
        "sector": "Healthcare",
        "is_active": True,
    },
    {
        "symbol": "TATAMOTORS.NS",
        "name": "Tata Motors Limited",
        "sector": "Automobile",
        "is_active": True,
    },
    {
        "symbol": "MARUTI.NS",
        "name": "Maruti Suzuki India Limited",
        "sector": "Automobile",
        "is_active": True,
    },
    {
        "symbol": "NTPC.NS",
        "name": "NTPC Limited",
        "sector": "Utilities",
        "is_active": True,
    },
    {
        "symbol": "ONGC.NS",
        "name": "Oil and Natural Gas Corporation Limited",
        "sector": "Energy",
        "is_active": True,
    },
    {
        "symbol": "TITAN.NS",
        "name": "Titan Company Limited",
        "sector": "Consumer Durables",
        "is_active": True,
    },
]


async def seed_stocks() -> None:
    async with AsyncSessionFactory() as session:
        for stock_data in TOP_INDIAN_STOCKS:
            stmt = select(Stock).where(Stock.symbol == stock_data["symbol"])
            existing_stock = await session.scalar(stmt)
            if existing_stock is None:
                stock = Stock(
                    uuid=uuid4(),
                    symbol=stock_data["symbol"],
                    name=stock_data["name"],
                    sector=stock_data["sector"],
                    is_active=stock_data["is_active"],
                )
                session.add(stock)
                print(f"Added: {stock_data['symbol']} - {stock_data['name']}")
            else:
                print(f"Already exists: {stock_data['symbol']}")
        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed_stocks())
