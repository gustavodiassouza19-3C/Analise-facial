from fastapi import APIRouter

from .endpoints import analyze, test

api_router = APIRouter()
api_router.include_router(analyze.router, prefix="/analyze", tags=["analyze"])
api_router.include_router(test.router, prefix="/test", tags=["test"])