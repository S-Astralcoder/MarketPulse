from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

import jwt

from src.config import get_config_settings

config = get_config_settings()


async def generate_jwt_token(email: str, password: str) -> str:
    expire_date = datetime.now(tz=UTC) + timedelta(days=config.JWT_EXPIRE_DAYS)

    payload = {
        "email": email,
        "password": password,
        "exp": expire_date,
        "iat": datetime.now(tz=UTC),
    }

    token = jwt.encode(
        payload=payload, key=config.JWT_SECRET, algorithm=config.JWT_ALGO
    )

    return token


async def decode_jwt_token(token: str) -> dict:
    decoded_payload = jwt.decode(
        jwt=token, key=config.JWT_SECRET, algorithms=config.JWT_ALGO
    )
    return decoded_payload
