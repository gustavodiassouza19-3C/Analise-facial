import base64
import math
import numpy as np
import cv2
import mediapipe as mp
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.analysis_repository import AnalysisRepository
from app.schemas.analysis import AnalysisCreate, AnalysisResponse
from app.core.config import settings


# ======================================================================
#  LANDMARK INDICES (MediaPipe FaceMesh 468 pontos)
# ======================================================================

# Olhos
OLHO_ESQ_CENTRO = 33
OLHO_DIR_CENTRO = 263

# Eixo facial central
NARIZ_PONTA = 1
QUEIXO = 152

# Tercos faciais
TRICHION = 10       # linha do cabelo
GLABELLA = 8        # entre as sobrancelhas
SUBNASALE = 2       # base do septo nasal

# Nariz e labios
PRANASALE = 1       # ponta do nariz
LABIALE_SUPERIUS = 13
LABIALE_INFERIUS = 14

# Laterais do rosto
LATERAL_ESQ = 234
LATERAL_DIR = 454
BOCHECHA_ESQ = 127
BOCHECHA_DIR = 356

# Cantos da boca
BOCA_ESQ = 61
BOCA_DIR = 291

# Cantos externos dos olhos
OLHO_EXT_ESQ = 33
OLHO_EXT_DIR = 263

# Cantos internos dos olhos
OLHO_INT_ESQ = 133
OLHO_INT_DIR = 362

# Mandibula / Jawline (perfil)
MANDIBULA_PONTOS = [
    172,   # angulo mandibular esquerdo
    397,   # angulo mandibular direito
    149,   # lateral mandibula esquerda
    378,   # lateral mandibula direita
    150,   # queixo lateral esquerdo
    379,   # queixo lateral direito
    152,   # menton (queixo inferior)
]

# Landmarks criticos para validacao de perfil
PERFIL_LANDMARKS_CRITICOS = [
    SUBNASALE,      # 2 - base do septo nasal
    PRANASALE,      # 1 - ponta do nariz
    LABIALE_SUPERIUS,  # 13 - labio superior
    LABIALE_INFERIUS,  # 14 - labio inferior
    QUEIXO,         # 152 - queixo
]


# ======================================================================
#  PARES DE SIMETRIA (esquerdo, direito)
# ======================================================================

PARES_SIMETRIA = [
    (OLHO_EXT_ESQ, OLHO_EXT_DIR),
    (OLHO_INT_ESQ, OLHO_INT_DIR),
    (BOCHECHA_ESQ, BOCHECHA_DIR),
    (LATERAL_ESQ, LATERAL_DIR),
    (BOCA_ESQ, BOCA_DIR),
]


# ======================================================================
#  REFERENCIAS ANatomicas (media, desvio_padrao)
# ======================================================================

REFERENCIAS = {
    "terco_superior": {"ideal": 33.3, "sigma": 3.0},
    "terco_medio": {"ideal": 33.3, "sigma": 3.0},
    "terco_inferior": {"ideal": 33.3, "sigma": 3.0},
    "angulo_nasolabial": {"ideal": 100.0, "sigma": 10.0},
    "simetria": {"ideal": 0.0, "sigma": 0.1},
}


# ======================================================================
#  FUNCOES MATEMATICAS
# ======================================================================

def zscore_to_score(valor: float, ideal: float, sigma: float) -> float:
    """Converte valor anatomico para score 0-100 usando distribuicao gaussiana."""
    if sigma <= 0:
        return 50.0
    z = abs(valor - ideal) / sigma
    score = 100.0 * math.exp(-0.5 * z ** 2)
    return max(0.0, min(100.0, round(score, 1)))


def media_filtrada(valores: list[float | None]) -> float | None:
    """Media ignorando None."""
    validos = [v for v in valores if v is not None]
    if not validos:
        return None
    return round(sum(validos) / len(validos), 1)


def calcular_histograma_cor(image: np.ndarray) -> np.ndarray:
    """Calcula histograma normalizado de cores (BGR) para comparacao."""
    hist = cv2.calcHist([image], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
    cv2.normalize(hist, hist)
    return hist.flatten()


def comparar_histogramas(hist1: np.ndarray, hist2: np.ndarray) -> float:
    """Compara dois histogramas usando correlacao. Retorna 0-1 (1 = identicos)."""
    return cv2.compareHist(
        hist1.reshape(-1, 1).astype(np.float32),
        hist2.reshape(-1, 1).astype(np.float32),
        cv2.HISTCMP_CORREL,
    )


def validar_perfil_landmarks(landmarks, nome_foto: str) -> None:
    """
    Valida se os landmarks criticos do perfil foram detectados.
    Lanca HTTP 422 se os pontos estiverem ausentes ou nao detectaveis.
    """
    if landmarks is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Nenhum rosto detectado na foto de perfil ({nome_foto}). "
                   f"Por favor, envie fotos de perfil nitidas e na posicao correta.",
        )

    # Verificar se os landmarks criticos do perfil existem e sao validos
    pontos_ausentes = []
    for idx in PERFIL_LANDMARKS_CRITICOS:
        lm = landmarks[idx]
        # Verificar se o landmark nao esta no centro exato (0,0) = nao detectado
        if lm.x == 0.0 and lm.y == 0.0:
            pontos_ausentes.append(idx)

    if len(pontos_ausentes) > 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Nao foi possivel detectar o contorno da mandibula ou o perfil lateral "
                   f"na foto {nome_foto}. Por favor, envie fotos de perfil nitidas e na posicao correta.",
        )

    # Verificar se o yaw indica que e uma foto de perfil (diferenca entre laterais)
    lado_esq = landmarks[LATERAL_ESQ]
    lado_dir = landmarks[LATERAL_DIR]
    dist_lateral_esq = abs(lado_esq.x - landmarks[BOCHECHA_ESQ].x)
    dist_lateral_dir = abs(lado_dir.x - landmarks[BOCHECHA_DIR].x)

    # Em uma foto de perfil, um lado deve ser significativamente menor
    if dist_lateral_esq > 0.01 and dist_lateral_dir > 0.01:
        razao = min(dist_lateral_esq, dist_lateral_dir) / max(dist_lateral_esq, dist_lateral_dir)
        if razao > 0.7:
            # Fotos muito simetricas = provavelmente frontal, nao perfil
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"A foto {nome_foto} parece ser uma foto frontal, nao de perfil. "
                       f"Por favor, envie fotos de perfil (lateral esquerdo e direito).",
            )


def distancia_2d(p1, p2) -> float:
    """Distancia euclidiana entre dois pontos normalizados."""
    return math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)


def angulo_entre_vetores(v1: tuple, v2: tuple) -> float:
    """Angulo em graus entre dois vetores 2D."""
    dot = v1[0] * v2[0] + v1[1] * v2[1]
    mag1 = math.sqrt(v1[0] ** 2 + v1[1] ** 2)
    mag2 = math.sqrt(v2[0] ** 2 + v2[1] ** 2)
    if mag1 == 0 or mag2 == 0:
        return 0.0
    cos_angle = max(-1.0, min(1.0, dot / (mag1 * mag2)))
    return math.degrees(math.acos(cos_angle))


# ======================================================================
#  ANALISE POR DIP (Distancia Interpupilar)
# ======================================================================

def calcular_dip(landmarks) -> float:
    """
    Distancia interpupilar como vetor de escala unitario.
    Todas as distancias faciais serao expressas como razao da DIP.
    """
    return distancia_2d(landmarks[OLHO_ESQ_CENTRO], landmarks[OLHO_DIR_CENTRO])


# ======================================================================
#  VALIDACAO DE POSE
# ======================================================================

def calcular_inclinacao(landmarks) -> tuple[float, float]:
    """
    Calcula Roll e Yaw a partir dos olhos e laterais do rosto.

    Roll: angulo dos olhos em relacao a horizontal
    Yaw: diferenca de escala entre laterais esquerda e direita

    Retorna (roll, yaw) em graus.
    """
    # Roll
    olho_esq = landmarks[OLHO_ESQ_CENTRO]
    olho_dir = landmarks[OLHO_DIR_CENTRO]
    roll = math.degrees(math.atan2(olho_dir.y - olho_esq.y, olho_dir.x - olho_esq.x))

    # Yaw
    lado_esq = landmarks[LATERAL_ESQ]
    lado_dir = landmarks[LATERAL_DIR]
    orelha_esq = landmarks[BOCHECHA_ESQ]
    orelha_dir = landmarks[BOCHECHA_DIR]
    largura_esq = abs(lado_esq.x - orelha_esq.x)
    largura_dir = abs(lado_dir.x - orelha_dir.x)
    soma = largura_dir + largura_esq
    yaw = math.degrees(math.atan2(largura_dir - largura_esq, soma)) if soma > 0 else 0.0

    return round(roll, 2), round(yaw, 2)


# ======================================================================
#  SIMETRIA REAL POR REFLEXAO
# ======================================================================

def calcular_simetria(landmarks, dip: float) -> tuple[float, dict]:
    """
    Desvio absoluto medio entre lados esquerdo e direito, normalizado por DIP.
    Eixo central: reta que passa pelo landmark 4 (nariz) e 152 (queixo).
    """
    eixo_x = (landmarks[NARIZ_PONTA].x + landmarks[QUEIXO].x) / 2

    desvios = []
    for idx_esq, idx_dir in PARES_SIMETRIA:
        dist_esq = abs(landmarks[idx_esq].x - eixo_x) / dip
        dist_dir = abs(landmarks[idx_dir].x - eixo_x) / dip
        desvios.append(abs(dist_esq - dist_dir))

    desvio_medio = sum(desvios) / len(desvios) if desvios else 0
    score = zscore_to_score(desvio_medio, REFERENCIAS["simetria"]["ideal"], REFERENCIAS["simetria"]["sigma"])

    detalhes = {
        "desvio_medio": round(desvio_medio, 4),
        "pares_analisados": len(PARES_SIMETRIA),
    }

    return score, detalhes


# ======================================================================
#  TERÇOS ANATOMICOS
# ======================================================================

def calcular_tercos(landmarks, dip: float) -> tuple[dict, dict]:
    """
    Tercos faciais normalizados por DIP.
    Superior: Trichion(10) -> Glabella(8)
    Medio: Glabella(8) -> Subnasale(2)
    Inferior: Subnasale(2) -> Menton(152)
    """
    trichion_y = landmarks[TRICHION].y
    glabella_y = landmarks[GLABELLA].y
    subnasale_y = landmarks[SUBNASALE].y
    menton_y = landmarks[QUEIXO].y

    superior = (glabella_y - trichion_y) / dip
    medio = (subnasale_y - glabella_y) / dip
    inferior = (menton_y - subnasale_y) / dip
    total = superior + medio + inferior

    if total == 0:
        return {"superior": 33.3, "medio": 33.3, "inferior": 33.3}, {}

    pct_sup = (superior / total) * 100
    pct_med = (medio / total) * 100
    pct_inf = (inferior / total) * 100

    tercos = {
        "superior": round(pct_sup, 1),
        "medio": round(pct_med, 1),
        "inferior": round(pct_inf, 1),
    }

    detalhes = {
        "distancia_superior_dip": round(superior, 4),
        "distancia_medio_dip": round(medio, 4),
        "distancia_inferior_dip": round(inferior, 4),
    }

    return tercos, detalhes


# ======================================================================
#  ANGULO NASOLABIAL (perfil)
# ======================================================================

def calcular_angulo_nasolabial(landmarks) -> float | None:
    """
    Angulo entre septo nasal e labio superior (vista de perfil).
    Subnasale(2) como vertice, Pranasale(1) e Labiale_Superius(13).
    """
    try:
        sub = landmarks[SUBNASALE]
        pra = landmarks[PRANASALE]
        lab = landmarks[LABIALE_SUPERIUS]

        v1 = (pra.x - sub.x, pra.y - sub.y)
        v2 = (lab.x - sub.x, lab.y - sub.y)

        return round(angulo_entre_vetores(v1, v2), 1)
    except (IndexError, KeyError):
        return None


# ======================================================================
#  PLANO E DE RICKETTS (perfil)
# ======================================================================

def calcular_ricketts(landmarks, dip: float) -> dict | None:
    """
    Distancia perpendicular dos labios a linha E (Pranasale -> Menton), normalizada por DIP.
    Positivo = labio anterior a linha E.
    """
    try:
        pra = landmarks[PRANASALE]
        menton = landmarks[QUEIXO]
        lab_sup = landmarks[LABIALE_SUPERIUS]
        lab_inf = landmarks[LABIALE_INFERIUS]

        dx = menton.x - pra.x
        dy = menton.y - pra.y
        line_len = math.sqrt(dx ** 2 + dy ** 2)

        if line_len == 0:
            return {"superior": 0.0, "inferior": 0.0}

        def perp_dist(p):
            cross = dy * p.x - dx * p.y
            cross += menton.x * pra.y - menton.y * pra.x
            return cross / line_len

        return {
            "superior": round(perp_dist(lab_sup) / dip, 4),
            "inferior": round(perp_dist(lab_inf) / dip, 4),
        }
    except (IndexError, KeyError):
        return None


# ======================================================================
#  SCORE DE PERFIL (MANDIBULA + CONTOURNO)
# ======================================================================

def _calcular_score_perfil(landmarks, dip: float) -> float:
    """
    Calcula score do contorno mandibular e perfil lateral.
    Combina: angulo nasolabial + Ricketts + definicao da mandibula.
    """
    scores = []

    # 1. Angulo nasolabial (peso 40%)
    angulo = calcular_angulo_nasolabial(landmarks)
    if angulo is not None:
        s_angulo = zscore_to_score(angulo, **REFERENCIAS["angulo_nasolabial"])
        scores.append(("angulo", s_angulo, 0.4))

    # 2. Ricketts (peso 30%)
    rick = calcular_ricketts(landmarks, dip)
    if rick is not None:
        # Ideal: labio superior levemente anterior (valor positivo pequeno)
        dist_sup = abs(rick["superior"])
        s_rick = zscore_to_score(dist_sup, 0.02, 0.03)  # ideal ~0.02 DIP
        scores.append(("ricketts", s_rick, 0.3))

    # 3. Definicao da mandibula (peso 30%)
    # Verificar angulo mandibular
    mand_esq = landmarks[MANDIBULA_PONTOS[0]]
    mand_dir = landmarks[MANDIBULA_PONTOS[1]]
    menton = landmarks[MANDIBULA_PONTOS[6]]

    # Largura da mandibula normalizada por DIP
    largura_mand = abs(mand_esq.x - mand_dir.x) / dip
    # Altura da mandibula normalizada por DIP
    alt_mand = abs(menton.y - (mand_esq.y + mand_dir.y) / 2) / dip

    # Ratio largura/altura ideal: ~1.2-1.5
    if alt_mand > 0:
        ratio_mand = largura_mand / alt_mand
        s_mand = zscore_to_score(ratio_mand, 1.35, 0.2)
        scores.append(("mandibula", s_mand, 0.3))

    if not scores:
        return 50.0

    # Media ponderada
    total_peso = sum(p for _, _, p in scores)
    if total_peso == 0:
        return 50.0

    resultado = sum(s * p for _, s, p in scores) / total_peso
    return round(resultado, 1)


# ======================================================================
#  SERVICO PRINCIPAL
# ======================================================================

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
                detail="Dados de imagem invalidos",
            )

    def _detect_landmarks(self, image: np.ndarray):
        """Detecta 468 landmarks do MediaPipe FaceMesh. Retorna None se nao detectar."""
        with self.mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            min_detection_confidence=settings.MIN_DETECTION_CONFIDENCE,
        ) as face_mesh:
            rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb)
            if results.multi_face_landmarks:
                return results.multi_face_landmarks[0]
            return None

    def _analyze_facial_features(self, images: list[np.ndarray]) -> dict:
        front_image = images[0]
        left_image = images[1] if len(images) > 1 else None
        right_image = images[2] if len(images) > 2 else None

        # 0. Validar imagens duplicadas (comparacao de histogramas)
        if left_image is not None and right_image is not None:
            hist_front = calcular_histograma_cor(front_image)
            hist_left = calcular_histograma_cor(left_image)
            hist_right = calcular_histograma_cor(right_image)

            sim_front_left = comparar_histogramas(hist_front, hist_left)
            sim_front_right = comparar_histogramas(hist_front, hist_right)
            sim_left_right = comparar_histogramas(hist_left, hist_right)

            if sim_front_left > 0.95:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="A foto esquerda parece identica a foto frontal. "
                           "Por favor, envie fotos de perfil diferentes.",
                )
            if sim_front_right > 0.95:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="A foto direita parece identica a foto frontal. "
                           "Por favor, envie fotos de perfil diferentes.",
                )
            if sim_left_right > 0.95:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="As fotos de perfil esquerdo e direito parecem identicas. "
                           "Por favor, envie fotos de lados diferentes.",
                )

        # 1. Detectar landmarks na foto frontal
        lm_front = self._detect_landmarks(front_image)
        if lm_front is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Nenhum rosto detectado na foto frontal",
            )

        # 2. Validar pose (Roll e Yaw)
        roll, yaw = calcular_inclinacao(lm_front)
        if abs(roll) > 5 or abs(yaw) > 5:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Rosto inclinado (roll={roll}°, yaw={yaw}°). Por favor, centralize para a foto.",
            )

        # 3. Calcular DIP (normalizacao)
        dip = calcular_dip(lm_front)
        if dip == 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Nao foi possivel calcular a distancia interpupilar",
            )

        # 4. Metricas da foto frontal
        score_simetria, det_simetria = calcular_simetria(lm_front, dip)
        tercos, det_tercos = calcular_tercos(lm_front, dip)

        # 5. Detectar e VALIDAR landmarks nos perfis (OBRIGATORIO)
        lm_left = self._detect_landmarks(left_image) if left_image is not None else None
        lm_right = self._detect_landmarks(right_image) if right_image is not None else None

        # Validacao obrigatoria do perfil esquerdo
        validar_perfil_landmarks(lm_left, "perfil esquerdo")
        # Validacao obrigatoria do perfil direito
        validar_perfil_landmarks(lm_right, "perfil direito")

        # 6. Metricas dos perfis (media dos dois lados)
        angulo_esq = calcular_angulo_nasolabial(lm_left)
        angulo_dir = calcular_angulo_nasolabial(lm_right)
        angulo_nasolabial = media_filtrada([angulo_esq, angulo_dir])

        ricketts_esq = calcular_ricketts(lm_left, dip)
        ricketts_dir = calcular_ricketts(lm_right, dip)

        # Score de mandibula/perfil baseado na media dos dois lados
        score_perfil_esq = _calcular_score_perfil(lm_left, dip) if lm_left else None
        score_perfil_dir = _calcular_score_perfil(lm_right, dip) if lm_right else None
        score_perfil = media_filtrada([score_perfil_esq, score_perfil_dir])

        # 7. Scores por Z-score
        score_terco_sup = zscore_to_score(tercos["superior"], **REFERENCIAS["terco_superior"])
        score_terco_med = zscore_to_score(tercos["medio"], **REFERENCIAS["terco_medio"])
        score_terco_inf = zscore_to_score(tercos["inferior"], **REFERENCIAS["terco_inferior"])

        if angulo_nasolabial is not None:
            score_nasolabial = zscore_to_score(angulo_nasolabial, **REFERENCIAS["angulo_nasolabial"])
        else:
            score_nasolabial = 50.0

        # 8. Score geral (media ponderada COM perfil)
        # Pesos: Frontal 60% (simetria 20%, tercos 40%) + Perfil 40% (nasolabial 20%, mandibula 20%)
        overall_score = (
            score_simetria * 0.20
            + score_terco_sup * 0.13
            + score_terco_med * 0.13
            + score_terco_inf * 0.14
            + score_nasolabial * 0.20
            + (score_perfil if score_perfil else 50.0) * 0.20
        )

        # 9. Confidence = 1.0 (todas as 3 fotos sao obrigatorias)
        confidence = 1.0

        # 10. Highlights
        highlights = []
        if score_simetria >= 85:
            highlights.append("Simetria Facial Excelente")
        if angulo_nasolabial and 90 <= angulo_nasolabial <= 110:
            highlights.append("Angulo Nasolabial Ideal")
        if score_terco_sup >= 80 and score_terco_med >= 80 and score_terco_inf >= 80:
            highlights.append("Tercos Faciais Equilibrados")
        if ricketts_esq and ricketts_esq["superior"] > 0:
            highlights.append("Labio Superior em Posicao Ideal")
        if score_perfil and score_perfil >= 80:
            highlights.append("Contorno Mandibular Definido")
        if roll == 0 and yaw == 0:
            highlights.append("Pose Frontal Perfeita")

        # 11. Categorias
        def badge(s):
            if s >= 90: return "Excelente"
            if s >= 75: return "Muito Bom"
            if s >= 60: return "Bom"
            return "Regular"

        return {
            "overall_score": round(overall_score, 1),
            "confidence": confidence,
            "harmony_score": round(overall_score, 1),
            "symmetry_score": round(score_simetria, 1),
            "thirds_data": [
                {"label": "Terco Superior (Testa)", "value": tercos["superior"]},
                {"label": "Terco Medio (Nariz)", "value": tercos["medio"]},
                {"label": "Terco Inferior (Mandibula)", "value": tercos["inferior"]},
            ],
            "radar_data": [
                {"feature": "Simetria", "score": round(score_simetria)},
                {"feature": "Terco Superior", "score": round(score_terco_sup)},
                {"feature": "Terco Medio", "score": round(score_terco_med)},
                {"feature": "Terco Inferior", "score": round(score_terco_inf)},
                {"feature": "Nasolabial", "score": round(score_nasolabial)},
                {"feature": "Mandibula", "score": round(score_perfil) if score_perfil else 0},
            ],
            "highlights": highlights[:4],
            "categories": [
                {"name": "Simetria Lateral", "score": round(score_simetria, 1), "badge": badge(score_simetria)},
                {"name": "Tercos Faciais", "score": round((score_terco_sup + score_terco_med + score_terco_inf) / 3, 1), "badge": badge((score_terco_sup + score_terco_med + score_terco_inf) / 3)},
                {"name": "Angulo Nasolabial", "score": round(score_nasolabial, 1), "badge": badge(score_nasolabial)},
                {"name": "Contorno Mandibular", "score": round(score_perfil, 1) if score_perfil else 0, "badge": badge(score_perfil) if score_perfil else "N/A"},
            ],
        }

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
