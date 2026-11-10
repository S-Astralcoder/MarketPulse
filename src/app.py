from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from src.service.schedular import lifespan

from .endpoint.health import check_router
from .endpoint.metrics import metrics
from .endpoint.track_stock import track_stock
from .endpoint.user import user_router

app = FastAPI(lifespan=lifespan)


app.include_router(check_router)
app.include_router(user_router)
app.include_router(metrics)
app.include_router(track_stock)
app.mount(path="/", app=StaticFiles(directory="static", html=True), name="static")
