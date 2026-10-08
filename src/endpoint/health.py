from fastapi import APIRouter


check_router = APIRouter(prefix="/check", tags=["Check"])


@check_router.get("/health")
def health():
    return {"message" : "working fine!"}
