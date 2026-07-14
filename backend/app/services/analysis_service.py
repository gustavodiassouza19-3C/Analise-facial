import json
from openai import AsyncOpenAI
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.analysis_repository import AnalysisRepository
from app.schemas.analysis import AnalysisCreate, AnalysisResponse
from app.core.config import settings


SYSTEM_PROMPT = """\
Você é um especialista mundial em Visagismo e Estética Facial, com mais de 30 anos de experiência em análise morfológica, proporcionalidade facial e harmonia estética.

Analise CONJUNTAMENTE as 3 fotografias fornecidas (foto frontal, perfil esquerdo e perfil direito) e produza uma avaliação qualitativa e quantitativa completa da anatomia facial do utilizador.

## Regras de Análise
1. Avalie a simetria facial comparando os lados esquerdo e direito na foto frontal.
2. Analise os terços faciais (superior, médio, inferior) e o equilíbrio entre eles.
3. Avalie o contorno mandibular e a definição do profile nas fotos laterais.
4. Identifique pontos fortes e áreas de melhoria de forma construtiva.
5. As pontuações devem ser realistas e justas — não inflacione nem deprecie artificialmente.

## Validação
Se as imagens não contiverem rostos humanos (por exemplo: imagens de animais, objetos, paisagens, ou imagens corrompidas), retorne EXATAMENTE:
{"error": true, "message": "Rosto humano não detectado nas imagens fornecidas"}

## Formato de Saída
Retorne APENAS um JSON válido, sem nenhum texto adicional antes ou depois. O JSON deve seguir EXATAMENTE esta estrutura:

{
  "overall_score": <inteiro 0-100>,
  "symmetry_score": <inteiro 0-100>,
  "categories": {
    "terco_superior": {"score": <0-100>, "badge": "<Excelente|Muito Bom|Bom|Regular>"},
    "terco_medio": {"score": <0-100>, "badge": "<Excelente|Muito Bom|Bom|Regular>"},
    "terco_inferior": {"score": <0-100>, "badge": "<Excelente|Muito Bom|Bom|Regular>"},
    "contorno_mandibular": {"score": <0-100>, "badge": "<Excelente|Muito Bom|Bom|Regular>"}
  },
  "thirds_data": [<percentual_superior>, <percentual_medio>, <percentual_inferior>],
  "highlights": ["<destaque_1>", "<destaque_2>", "<destaque_3>", "<destaque_4>"],
  "visagismo_tips": {
    "formato_rosto": "<descrição do formato>",
    "cabelo": "<recomendações de corte>",
    "barba": "<recomendações de barba, se aplicável>",
    "oculos": "<recomendações de óculos>"
  }
}

Os thirds_data devem somar approximadamente 100 (ex: [33.3, 33.3, 33.4]).
O overall_score e symmetry_score devem ser inteiros.
Os highlights devem ter entre 1 e 4 strings descrevendo os pontos mais positivos.
"""


def _badge(score: float) -> str:
    if score >= 90:
        return "Excelente"
    if score >= 75:
        return "Muito Bom"
    if score >= 60:
        return "Bom"
    return "Regular"


class AnalysisService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.analysis_repo = AnalysisRepository(db)
        self.client = AsyncOpenAI(
            api_key=settings.DEEPSEEK_API_KEY,
            base_url=settings.DEEPSEEK_BASE_URL,
        )

    async def _call_deepseek(self, image_b64_list: list[str]) -> dict:
        """Send images to DeepSeek and return structured JSON analysis."""
        content = [
            {
                "type": "text",
                "text": (
                    "Analise estas 3 fotografias faciais (frontal, perfil esquerdo, perfil direito) "
                    "e retorne a avaliação estruturada em JSON conforme as instruções do sistema."
                ),
            }
        ]

        labels = ["Foto Frontal", "Perfil Esquerdo", "Perfil Direito"]
        for b64, label in zip(image_b64_list, labels):
            content.append({
                "type": "text",
                "text": f"[{label}]",
            })
            content.append({
                "type": "image_url",
                "image_url": {
                    "url": b64 if b64.startswith("data:") else f"data:image/jpeg;base64,{b64}",
                },
            })

        try:
            response = await self.client.chat.completions.create(
                model=settings.DEEPSEEK_MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": content},
                ],
                response_format={"type": "json_object"},
                max_tokens=2048,
                temperature=0.4,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Erro ao comunicar com a API de análise: {exc}",
            )

        raw = response.choices[0].message.content
        if not raw:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="A API de análise retornou uma resposta vazia.",
            )

        try:
            result = json.loads(raw)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="A API de análise retornou um JSON inválido.",
            )

        # Check for face detection failure
        if isinstance(result, dict) and result.get("error"):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=result.get("message", "Rosto humano não detectado nas imagens fornecidas"),
            )

        return result

    def _map_to_response(self, ai_result: dict) -> dict:
        """Map DeepSeek JSON output to the format the frontend expects."""
        overall = int(ai_result.get("overall_score", 50))
        symmetry = int(ai_result.get("symmetry_score", 50))

        # Categories
        cats = ai_result.get("categories", {})
        terco_sup = cats.get("terco_superior", {}).get("score", 50)
        terco_med = cats.get("terco_medio", {}).get("score", 50)
        terco_inf = cats.get("terco_inferior", {}).get("score", 50)
        mandibular = cats.get("contorno_mandibular", {}).get("score", 50)

        # Thirds data for the bar chart
        thirds_pcts = ai_result.get("thirds_data", [33.3, 33.3, 33.4])
        thirds_data = [
            {"label": "Terço Superior (Testa)", "value": round(thirds_pcts[0], 1)},
            {"label": "Terço Médio (Nariz)", "value": round(thirds_pcts[1], 1)},
            {"label": "Terço Inferior (Mandíbula)", "value": round(thirds_pcts[2], 1)},
        ]

        # Radar data for the radar chart
        radar_data = [
            {"feature": "Simetria", "score": symmetry},
            {"feature": "Terço Superior", "score": terco_sup},
            {"feature": "Terço Médio", "score": terco_med},
            {"feature": "Terço Inferior", "score": terco_inf},
            {"feature": "Contorno Mandibular", "score": mandibular},
        ]

        # Highlights
        highlights = ai_result.get("highlights", [])
        if not highlights:
            highlights = ["Análise facial completa"]

        # Categories list for the UI
        categories = [
            {"name": "Simetria Lateral", "score": symmetry, "badge": _badge(symmetry)},
            {"name": "Terço Superior", "score": terco_sup, "badge": _badge(terco_sup)},
            {"name": "Terço Médio", "score": terco_med, "badge": _badge(terco_med)},
            {"name": "Terço Inferior", "score": terco_inf, "badge": _badge(terco_inf)},
            {"name": "Contorno Mandibular", "score": mandibular, "badge": _badge(mandibular)},
        ]

        return {
            "overall_score": overall,
            "confidence": 1.0,
            "harmony_score": overall,
            "symmetry_score": symmetry,
            "thirds_data": thirds_data,
            "radar_data": radar_data,
            "highlights": highlights[:4],
            "categories": categories,
            "visagismo_tips": ai_result.get("visagismo_tips", {}),
        }

    async def analyze(self, data: AnalysisCreate, user_id: str) -> AnalysisResponse:
        # Normalize base64 strings (ensure they have the data URI prefix)
        photos = [data.photo_front, data.photo_right, data.photo_left]

        # Call DeepSeek API with all 3 images
        ai_result = await self._call_deepseek(photos)

        # Map to our response format
        result = self._map_to_response(ai_result)

        # Save to database
        db_analysis = await self.analysis_repo.create({
            "user_id": user_id,
            **result,
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
