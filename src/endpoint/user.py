from fastapi import APIRouter

from src.model import RegisterPayload, SignInPayload

user_router = APIRouter(prefix="/user", tags=["user"])


@user_router.post("/register")
def register(register: RegisterPayload):
    pass


@user_router.post("/signup")
def signup(sigin: SignInPayload):
    pass


@user_router.get("/signout")
def signout():
    pass
