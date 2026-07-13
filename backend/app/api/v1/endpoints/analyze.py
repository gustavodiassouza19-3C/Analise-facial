from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.schemas.analysis import AnalysisCreate, AnalysisResponse
from app.services.analysis_service import AnalysisService
from app.core.security import get_current_user
from app.models.user import User


router = APIRouter()


@router.post("/", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
async def analyze_face(
    data: AnalysisCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Analyze facial features from 3 photos (front, right, left).
    Requires authentication.
    """
    analysis_service = AnalysisService(db)
    return await analysis_service.analyze(data, current_user.id)


@router.get("/history", response_model=list[AnalysisResponse])
async def get_analysis_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get user's analysis history.
    """
    analysis_service = AnalysisService(db)
    return await analysis_service.get_user_analyses(current_user.id)
