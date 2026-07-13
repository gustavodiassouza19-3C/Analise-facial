from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ThirdData(BaseModel):
    label: str
    value: float


class RadarData(BaseModel):
    feature: str
    score: int


class CategoryResult(BaseModel):
    name: str
    score: float
    badge: str


class AnalysisResponse(BaseModel):
    id: str
    overall_score: float
    confidence: float
    harmony_score: float
    symmetry_score: float
    thirds_data: List[ThirdData]
    radar_data: List[RadarData]
    highlights: List[str]
    categories: List[CategoryResult]
    created_at: datetime

    model_config = {"from_attributes": True}


class AnalysisCreate(BaseModel):
    photo_front: str  # Base64 encoded
    photo_right: str
    photo_left: str
