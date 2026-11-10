import bcrypt
from fastapi import HTTPException, status
from sqlalchemy import select

from src.database import AsyncSession, User
from src.model import RegisterPayload, SignInPayload
from src.service.user_security import generate_jwt_token


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
            detail="User can't exist since google auth is not implemented.",
        )

    if bcrypt.checkpw(
        password=signin.password.encode("utf-8"),
        hashed_password=user_data.hash_password.encode("utf-8"),
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The given password is Invalid!",
        )

    jwt_token = await generate_jwt_token(email=signin.email, password=signin.password)

    return jwt_token
