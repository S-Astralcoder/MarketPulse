from typing import Annotated

from fastapi import APIRouter, Depends

from src.service.user_service import register_user, sigin_user
from src.database import AsyncSession, get_db
from src.model import RegisterPayload, SignInPayload

user_router = APIRouter(prefix="/user", tags=["user"])


@user_router.post("/register")
async def register(
    register: RegisterPayload, db: Annotated[AsyncSession, Depends(get_db)]
):
    token = await register_user(register=register, db=db)
    return {"access_token": token, "token_type": "Bearer"}


@user_router.post("/signup")
async def signup(sigin: SignInPayload, db: Annotated[AsyncSession, Depends(get_db)]):
    token = await sigin_user(sigin=sigin, db=db)
    return {"access_token": token, "token_type": "Bearer"}
