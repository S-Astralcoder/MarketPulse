from datetime import UTC, datetime, timedelta
from typing import Annotated

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from sqlalchemy import select

from src.config import get_config_settings
from src.database import AsyncSession, User, get_db
from src.model import AccessTokenPayload

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


async def get_signed_in_user(
    access_data: AccessTokenPayload, db: Annotated[AsyncSession, Depends(get_db)]
) -> User:
    try:
        user_jwt_payload = await decode_jwt_token(token=access_data.access_token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="The token has expired."
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="The token is invalid"
        )

    user_data = await db.scalar(
        select(User).where(User.email == user_jwt_payload["email"])
    )
    if user_data is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User doesn't exist"
        )
    if user_data.hash_password is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User can't exist since google auth is not implemented",
        )
    if not bcrypt.checkpw(
        password=user_jwt_payload["password"].encode("utf-8"),
        hashed_password=user_data.hash_password.encode("utf-8"),
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The password in token doesn't match",
        )
    return user_data
