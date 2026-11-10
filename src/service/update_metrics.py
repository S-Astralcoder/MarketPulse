from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

import yfinance as yf

from src.config import get_config_settings
from src.service.calculate_metrics import fetch_and_calculate_market_metrics_and_update


def is_indian_market_open():
    ticker = yf.Ticker("^NSEI")
    data = ticker.history(period="1d", interval="1m")

    if data.empty:
        return False

    last_market_time = data.index[-1]

    current_time_utc = datetime.now(UTC)
    return current_time_utc - last_market_time < timedelta(minutes=15)


async def update_market_metrics():
    config = get_config_settings()
    current_time = datetime.now(ZoneInfo("Asia/Kolkata")).time()

    market_open_time = datetime.strptime(config.MARKET_OPEN_TIME, "%H:%M").time()  # noqa: DTZ007
    market_close_time = datetime.strptime(  # noqa: DTZ007
        config.MARKET_CLOSE_TIME, "%H:%M"
    ).time()

    if (
        market_open_time <= current_time <= market_close_time
        and is_indian_market_open()
    ):
        await fetch_and_calculate_market_metrics_and_update()
