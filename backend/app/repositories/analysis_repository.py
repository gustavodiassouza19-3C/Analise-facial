from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.analysis import FacialAnalysis, AnalysisCategory


class AnalysisRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, analysis_id: str) -> FacialAnalysis | None:
        result = await self.db.execute(
            select(FacialAnalysis)
            .options(selectinload(FacialAnalysis.categories))
            .where(FacialAnalysis.id == analysis_id)
        )
        return result.scalar_one_or_none()

    async def get_by_user(self, user_id: str) -> list[FacialAnalysis]:
        result = await self.db.execute(
            select(FacialAnalysis)
            .options(selectinload(FacialAnalysis.categories))
            .where(FacialAnalysis.user_id == user_id)
            .order_by(FacialAnalysis.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, analysis_data: dict) -> FacialAnalysis:
        categories_data = analysis_data.pop("categories", [])
        analysis = FacialAnalysis(**analysis_data)
        self.db.add(analysis)
        await self.db.flush()

        for cat_data in categories_data:
            category = AnalysisCategory(analysis_id=analysis.id, **cat_data)
            self.db.add(category)

        await self.db.commit()
        await self.db.refresh(analysis)
        return analysis
