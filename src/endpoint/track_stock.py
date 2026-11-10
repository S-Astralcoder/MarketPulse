from typing import Annotated

from fastapi import APIRouter, Depends

from src.database import AsyncSession, User, get_db
from src.service.track_service import add_stock_track, remove_stock_track
from src.service.user_security import get_signed_in_user

track_stock = APIRouter(prefix="/track", tags=["track"])


@track_stock.post("")
async def track(
    stock_symbol: str,
    user_data: Annotated[User, Depends(get_signed_in_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await add_stock_track(symbol=stock_symbol, user_id=user_data.uuid, db=db)
    return {"message": "Tracked Successfully!"}


@track_stock.delete("")
async def untrack(
    stock_symbol: str,
    user_data: Annotated[User, Depends(get_signed_in_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await remove_stock_track(symbol=stock_symbol, user_id=user_data.uuid, db=db)
    return {"message": "Untracked Successfully!"}
