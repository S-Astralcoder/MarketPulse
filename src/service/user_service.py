import bcrypt
from fastapi import HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy import select

from src.config import get_config_settings
from src.database import AsyncSession, User
from src.model import GooglePayload, RegisterPayload, SignInPayload
from src.service.user_security import (
    generate_jwt_token,
    generate_jwt_token_using_google_id,
)

config = get_config_settings()


async def register_user(register: RegisterPayload, db: AsyncSession) -> str:
    if await db.scalar(select(User).where(User.email == register.email)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists!"
        )

    hash_password = bcrypt.hashpw(
        password=register.password.encode("utf-8"), salt=bcrypt.gensalt()
    )

    user_instance = User(
        username=register.name,
        email=register.email,
        hash_password=hash_password.decode(),
    )
    jwt_token = await generate_jwt_token(
        email=register.email, password=register.password
    )

    db.add(user_instance)

    return jwt_token


async def signin_user(signin: SignInPayload, db: AsyncSession):
    user_data = await db.scalar(select(User).where(User.email == signin.email))
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User doesn't exists!"
        )

    if user_data.hash_password is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SignIn/SignUp Using google Auth.",
        )

    if not bcrypt.checkpw(
        password=signin.password.encode("utf-8"),
        hashed_password=user_data.hash_password.encode("utf-8"),
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The given password is Invalid!",
        )

    jwt_token = await generate_jwt_token(email=signin.email, password=signin.password)

    return jwt_token


async def authenticate_google_user(google: GooglePayload, db: AsyncSession):
    try:
        id_info = id_token.verify_oauth2_token(
            id_token=google.token,
            request=google_requests.Request(),
            audience=config.GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Credentials."
        )

    google_user_id = id_info.get("sub")
    email = id_info.get("email")
    email_verified = id_info.get("email_verified", False)
    name = id_info.get("name")
    picture = id_info.get("picture")
    if not email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account email is not verified",
        )

    user_data = await db.scalar(select(User).where(User.google_id == google_user_id))
    email_user_data = await db.scalar(select(User).where(User.email == email))

    if not user_data and email_user_data:
        email_user_data.google_id = google_user_id
    elif not user_data:
        user_info = User(
            google_id=google_user_id, username=name, email=email, picture_url=picture
        )
        db.add(user_info)

    token = await generate_jwt_token_using_google_id(google_id=google_user_id)  # type: ignore

    return token
