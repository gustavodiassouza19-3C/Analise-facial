from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.profile import UserProfileUpdate, UserProfileResponse

router = APIRouter()


@router.get("/", response_model=UserProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/", response_model=UserProfileResponse)
async def update_profile(
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return current_user
