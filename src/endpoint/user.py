from fastapi import APIRouter

user_router = APIRouter(prefix="/user", tags=["user"])


@user_router.post("/register")
def register():
    pass


@user_router.post("/signup")
def signup():
    pass


@user_router.get("/signout")
def signout():
    pass
