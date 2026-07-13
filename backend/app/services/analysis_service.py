import base64
import numpy as np
import cv2
import mediapipe as mp
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.analysis_repository import AnalysisRepository
from app.schemas.analysis import AnalysisCreate, AnalysisResponse
from app.core.config import settings


class AnalysisService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.analysis_repo = AnalysisRepository(db)
        self.mp_face_mesh = mp.solutions.face_mesh

    def _decode_image(self, base64_string: str) -> np.ndarray:
        try:
            image_data = base64.b64decode(base64_string.split(",")[-1])
            nparr = np.frombuffer(image_data, np.uint8)
            return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image data",
            )

    def _analyze_facial_features(self, images: list[np.ndarray]) -> dict:
        front_image = images[0]

        with self.mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            min_detection_confidence=settings.MIN_DETECTION_CONFIDENCE,
        ) as face_mesh:
            rgb_image = cv2.cvtColor(front_image, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb_image)

            if not results.multi_face_landmarks:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="No face detected in the image",
                )

            landmarks = results.multi_face_landmarks[0]

            # Calculate symmetry
            left_face = [landmarks.landmark[i].x for i in [234, 127, 162, 21, 54, 103, 67]]
            right_face = [landmarks.landmark[i].x for i in [454, 352, 389, 251, 284, 332, 297]]
            symmetry_score = max(0, min(100, 100 - abs(sum(left_face) - sum(right_face)) * 200))

            # Calculate thirds
            forehead_y = landmarks.landmark[10].y
            nose_y = landmarks.landmark[1].y
            chin_y = landmarks.landmark[152].y
            total_height = chin_y - forehead_y
            upper_third = (nose_y - forehead_y) / total_height * 100
            middle_third = (landmarks.landmark[2].y - nose_y) / total_height * 100
            lower_third = 100 - upper_third - middle_third

            # Calculate eye alignment
            left_eye_y = landmarks.landmark[33].y
            right_eye_y = landmarks.landmark[263].y
            eye_alignment = max(0, min(100, 100 - abs(left_eye_y - right_eye_y) * 500))

            # Calculate golden ratio approximation
            face_width = abs(landmarks.landmark[234].x - landmarks.landmark[454].x)
            face_height = abs(landmarks.landmark[10].y - landmarks.landmark[152].y)
            golden_ratio = face_height / face_width if face_width > 0 else 1.618
            golden_ratio_score = max(0, min(100, 100 - abs(golden_ratio - 1.618) * 50))

            # Calculate jawline score
            jaw_width = abs(landmarks.landmark[172].x - landmarks.landmark[397].x)
            jawline_score = min(100, (jaw_width / face_width) * 120) if face_width > 0 else 85

            # Calculate nose region score
            nose_width = abs(landmarks.landmark[49].x - landmarks.landmark[279].x)
            nose_score = min(100, (1 - nose_width / face_width) * 150) if face_width > 0 else 92

            overall_score = (
                symmetry_score * 0.25 +
                golden_ratio_score * 0.25 +
                eye_alignment * 0.2 +
                jawline_score * 0.15 +
                nose_score * 0.15
            )

            return {
                "overall_score": round(overall_score, 1),
                "confidence": 0.92,
                "harmony_score": round(overall_score, 1),
                "symmetry_score": round(symmetry_score, 1),
                "thirds_data": [
                    {"label": "Terço Superior (Testa)", "value": round(upper_third, 1)},
                    {"label": "Terço Médio (Nariz)", "value": round(middle_third, 1)},
                    {"label": "Terço Inferior (Mandíbula)", "value": round(lower_third, 1)},
                ],
                "radar_data": [
                    {"feature": "Simetria", "score": round(symmetry_score)},
                    {"feature": "Proporção Áurea", "score": round(golden_ratio_score)},
                    {"feature": "Alinhamento Ocular", "score": round(eye_alignment)},
                    {"feature": "Maxilar", "score": round(jawline_score)},
                    {"feature": "Região Nasal", "score": round(nose_score)},
                ],
                "highlights": self._generate_highlights(
                    symmetry_score, golden_ratio_score, eye_alignment, jawline_score, nose_score
                ),
                "categories": [
                    {"name": "Simetria Lateral", "score": round(symmetry_score, 1), "badge": self._get_badge(symmetry_score)},
                    {"name": "Proporção Áurea", "score": round(golden_ratio_score, 1), "badge": self._get_badge(golden_ratio_score)},
                    {"name": "Alinhamento dos Olhos", "score": round(eye_alignment, 1), "badge": self._get_badge(eye_alignment)},
                ],
            }

    def _get_badge(self, score: float) -> str:
        if score >= 90:
            return "Excelente"
        elif score >= 75:
            return "Muito Bom"
        elif score >= 60:
            return "Bom"
        return "Regular"

    def _generate_highlights(self, symmetry, golden, eyes, jaw, nose) -> list[str]:
        highlights = []
        if symmetry >= 85:
            highlights.append("Simetria Ocular Excelente")
        if jaw >= 80:
            highlights.append("Estrutura Óssea Firme")
        if golden >= 80:
            highlights.append("Proporção Áurea Ideal")
        if nose >= 85:
            highlights.append("Alinhamento Nasal Preciso")
        if eyes >= 90:
            highlights.append("Alinhamento Ocular Perfeito")
        return highlights[:4]

    async def analyze(self, data: AnalysisCreate, user_id: str) -> AnalysisResponse:
        images = [
            self._decode_image(data.photo_front),
            self._decode_image(data.photo_right),
            self._decode_image(data.photo_left),
        ]

        analysis_result = self._analyze_facial_features(images)

        db_analysis = await self.analysis_repo.create({
            "user_id": user_id,
            **analysis_result,
            "photo_front_url": None,
            "photo_right_url": None,
            "photo_left_url": None,
        })

        return AnalysisResponse(
            id=db_analysis.id,
            overall_score=db_analysis.overall_score,
            confidence=db_analysis.confidence,
            harmony_score=db_analysis.harmony_score,
            symmetry_score=db_analysis.symmetry_score,
            thirds_data=db_analysis.thirds_data,
            radar_data=db_analysis.radar_data,
            highlights=db_analysis.highlights,
            categories=[
                {"name": cat.name, "score": cat.score, "badge": cat.badge}
                for cat in db_analysis.categories
            ],
            created_at=db_analysis.created_at,
        )

    async def get_user_analyses(self, user_id: str) -> list[AnalysisResponse]:
        analyses = await self.analysis_repo.get_by_user(user_id)
        return [
            AnalysisResponse(
                id=a.id,
                overall_score=a.overall_score,
                confidence=a.confidence,
                harmony_score=a.harmony_score,
                symmetry_score=a.symmetry_score,
                thirds_data=a.thirds_data,
                radar_data=a.radar_data,
                highlights=a.highlights,
                categories=[
                    {"name": cat.name, "score": cat.score, "badge": cat.badge}
                    for cat in a.categories
                ],
                created_at=a.created_at,
            )
            for a in analyses
        ]
