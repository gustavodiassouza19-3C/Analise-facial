from fastapi import APIRouter
from app.api.v1.endpoints import auth, analyze, health

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(analyze.router, prefix="/analyze", tags=["analyze"])
