from pydantic import BaseModel
from typing import List, Optional

class CategoryResult(BaseModel):
    name: str
    score: float  # 0-100
    badge: str  # Excelente, Muito Bom, Bom, Regular
    error: Optional[str] = None  # if validation fails for this category

class AnalysisResult(BaseModel):
    overall_score: float
    confidence: float
    categories: List[CategoryResult]