from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .endpoint.health import check_router
from .endpoint.user import user_router

app = FastAPI()

app.mount(path="/", app=StaticFiles(directory="static", html=True), name="static")

app.include_router(check_router)
app.include_router(user_router)
