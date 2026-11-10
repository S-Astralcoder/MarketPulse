from fastapi import APIRouter

from model import RegisterPayload, SignInPayload

user_router = APIRouter(prefix="/user", tags=["user"])


# TODO: Later Implement user authentication code


@user_router.post("/register")
def register(register: RegisterPayload):
    pass


@user_router.post("/signup")
def signup(sigin: SignInPayload):
    pass


@user_router.get("/signout")
def signout():
    pass
