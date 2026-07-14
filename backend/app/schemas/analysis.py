from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# ------------------------------------------------------------------ #
#  Existing schemas (image-based analysis)
# ------------------------------------------------------------------ #

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


class AnalysisPendingResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    overall_score: float
    created_at: datetime


# ------------------------------------------------------------------ #
#  Geometry analysis schemas (coordinate-based)
# ------------------------------------------------------------------ #

class PointSchema(BaseModel):
    """A single 2D anatomical landmark coordinate."""
    x: float = Field(..., description="Horizontal coordinate (px or normalized)")
    y: float = Field(..., description="Vertical coordinate (px or normalized)")


class ThirdResultSchema(BaseModel):
    """Result for a single facial third."""
    label: str
    distance: float = Field(..., description="Vertical distance in the same unit as input")
    percentage: float = Field(..., ge=0, le=100, description="Percentage of total face height")
    deviation: float = Field(..., ge=0, description="Absolute deviation from the ideal 33.3% target")


class ThirdsResponseSchema(BaseModel):
    """Complete facial thirds analysis."""
    superior: ThirdResultSchema
    middle: ThirdResultSchema
    inferior: ThirdResultSchema


class RickettsResponseSchema(BaseModel):
    """Ricketts E-line lip distances."""
    upper_lip_distance: float = Field(
        ..., description="Signed perpendicular distance of upper lip to E-line (positive = anterior)"
    )
    lower_lip_distance: float = Field(
        ..., description="Signed perpendicular distance of lower lip to E-line (positive = anterior)"
    )


class GeometryAnalysisInputSchema(BaseModel):
    """
    Coordinate input for geometric facial analysis.

    Expects pre-extracted landmark coordinates from the frontend
    or an upstream detection pipeline (MediaPipe, dlib, etc.).
    """
    # Front face points — facial thirds
    trichion: PointSchema = Field(..., description="Hairline midpoint")
    glabella: PointSchema = Field(..., description="Point between the eyebrows")
    subnasale_front: PointSchema = Field(..., description="Base of nasal septum (front view)")
    menton_front: PointSchema = Field(..., description="Lowest point of the chin (front view)")

    # Profile points — nasolabial angle & Ricketts
    subnasale_profile: PointSchema = Field(..., description="Base of nasal septum (profile view)")
    pranasale: PointSchema = Field(..., description="Nose tip (most anterior point)")
    labiale_superius: PointSchema = Field(..., description="Upper lip margin")
    labiale_inferius: PointSchema = Field(..., description="Lower lip margin")
    menton_profile: PointSchema = Field(..., description="Chin tip (profile view)")


class GeometryAnalysisResponseSchema(BaseModel):
    """
    Structured response containing all geometric facial measurements.
    """
    thirds: ThirdsResponseSchema
    nasolabial_angle: float = Field(
        ..., description="Nasolabial angle in degrees [0, 180]"
    )
    ricketts: RickettsResponseSchema


# ------------------------------------------------------------------ #
#  Face detection schemas
# ------------------------------------------------------------------ #

class FaceDetectSchema(BaseModel):
    """Input for face detection and cropping."""
    image: str = Field(..., description="Base64 encoded image (data:image/...;base64,...)")


class FaceDetectResponse(BaseModel):
    """Response with cropped face image."""
    cropped_image: str = Field(..., description="Cropped face as base64 data URI")
