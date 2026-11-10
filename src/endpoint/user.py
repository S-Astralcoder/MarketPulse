from typing import Annotated, Literal

from fastapi import APIRouter, Depends

from src.database import AsyncSession, User, get_db
from src.model import RegisterPayload, SignInPayload
from src.service.user_security import get_signed_in_user
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


@user_router.post("/info")
async def user_info(
    user_data: Annotated[User, Depends(get_signed_in_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    user_dict = user_data.to_dict()
    user_dict.pop("google_id")
    user_dict.pop("hash_password")
    return user_dict


@user_router.post("/access")
async def check_access(
    user_data: Annotated[User, Depends(get_signed_in_user)],
) -> Literal[True]:
    return True
