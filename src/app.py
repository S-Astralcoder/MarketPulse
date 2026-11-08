from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from src.service.schedular import lifespan

from .endpoint.health import check_router
from .endpoint.user import user_router

app = FastAPI(lifespan=lifespan)


app.mount(path="/", app=StaticFiles(directory="static", html=True), name="static")

app.include_router(check_router)
app.include_router(user_router)
