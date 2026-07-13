"""
Geometry Analysis endpoint — coordinate-based facial metrics.

Receives structured (x, y) landmark coordinates and returns
geometric measurements: facial thirds, nasolabial angle, and
Ricketts E-line distances.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.analysis import (
    GeometryAnalysisInputSchema,
    GeometryAnalysisResponseSchema,
    FaceDetectSchema,
    FaceDetectResponse,
)
from app.services.geometry_service import GeometryService
from app.services.face_detection_service import FaceDetectionService


router = APIRouter()


def get_geometry_service() -> GeometryService:
    """Dependency provider for GeometryService."""
    return GeometryService()


@router.post(
    "/calculate-metrics",
    response_model=GeometryAnalysisResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="Calculate geometric facial metrics",
    description=(
        "Receives anatomical landmark coordinates from front and profile "
        "views and returns facial thirds percentages, nasolabial angle, "
        "and Ricketts E-line lip distances."
    ),
)
async def calculate_metrics(
    data: GeometryAnalysisInputSchema,
    geometry_service: GeometryService = Depends(get_geometry_service),
) -> GeometryAnalysisResponseSchema:
    """
    POST /api/v1/analysis/calculate-metrics

    Validates input via Pydantic, delegates to GeometryService,
    and returns a fully validated response.
    """
    try:
        # Convert Pydantic models → plain dicts for the service layer
        trichion = data.trichion.model_dump()
        glabella = data.glabella.model_dump()
        subnasale_front = data.subnasale_front.model_dump()
        menton_front = data.menton_front.model_dump()
        subnasale_profile = data.subnasale_profile.model_dump()
        pranasale = data.pranasale.model_dump()
        labiale_superius = data.labiale_superius.model_dump()
        labiale_inferius = data.labiale_inferius.model_dump()
        menton_profile = data.menton_profile.model_dump()

        # 1. Facial thirds (front view)
        thirds = await geometry_service.calculate_facial_thirds(
            trichion=trichion,
            glabella=glabella,
            subnasale=subnasale_front,
            menton=menton_front,
        )

        # 2. Nasolabial angle (profile view)
        nasolabial_angle = await geometry_service.calculate_nasolabial_angle(
            subnasale=subnasale_profile,
            pranasale=pranasale,
            labiale_superius=labiale_superius,
        )

        # 3. Ricketts E-line (profile view)
        ricketts = await geometry_service.calculate_ricketts_line(
            pranasale=pranasale,
            menton=menton_profile,
            labiale_superius=labiale_superius,
            labiale_inferius=labiale_inferius,
        )

        return GeometryAnalysisResponseSchema(
            thirds=thirds,
            nasolabial_angle=nasolabial_angle,
            ricketts=ricketts,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid coordinate data: {exc}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Calculation error: {exc}",
        )


@router.post(
    "/detect-face",
    response_model=FaceDetectResponse,
    status_code=status.HTTP_200_OK,
    summary="Detect face and crop image",
    description="Receives a base64 image, detects the face, crops around it, and returns the cropped image.",
)
async def detect_face(data: FaceDetectSchema) -> FaceDetectResponse:
    """
    POST /api/v1/analysis/detect-face

    Detects the face in the image and returns a cropped version
    centered on the face with uniform padding.
    """
    try:
        service = FaceDetectionService()
        cropped = service.detect_and_crop(data.image)
        return FaceDetectResponse(cropped_image=cropped)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Face detection error: {exc}",
        )
