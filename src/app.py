from fastapi import FastAPI
from .endpoint.health import check_router

app = FastAPI()
app.include_router(check_router)




