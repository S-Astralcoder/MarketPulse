from datetime import datetime
from zoneinfo import ZoneInfo

from src.config import get_config_settings


async def update_market_metrics():
    config = get_config_settings()
    current_time = datetime.now(ZoneInfo("Asia/Kolkata")).time()

    market_open_time = datetime.strptime(config.MARKET_OPEN_TIME, "%H:%M").time()  # noqa: DTZ007
    market_close_time = datetime.strptime(  # noqa: DTZ007
        config.MARKET_CLOSE_TIME, "%H:%M"
    ).time()

    if market_open_time <= current_time <= market_close_time:
        print("Triggered")
    else:
        print("Not Triggered")
