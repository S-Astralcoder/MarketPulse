from typing import Annotated

from fastapi import APIRouter, Depends

from src.database import AsyncSession, get_db
from src.model import RegisterPayload, SignInPayload
from src.service.user_service import register_user, signin_user

user_router = APIRouter(prefix="/user", tags=["user"])


@user_router.post("/register")
async def register(
    register: RegisterPayload, db: Annotated[AsyncSession, Depends(get_db)]
) -> dict[str, str]:
    token = await register_user(register=register, db=db)
    return {"access_token": token, "token_type": "Bearer"}


@user_router.post("/signup")
async def signup(
    signin: SignInPayload, db: Annotated[AsyncSession, Depends(get_db)]
) -> dict[str, str]:
    token = await signin_user(signin=signin, db=db)
    return {"access_token": token, "token_type": "Bearer"}
