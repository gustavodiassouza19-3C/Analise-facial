from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import cv2
import numpy as np
from app.services.gatekeeper import validate_image
from app.services.calculator import compute_measurements, normalize_measurements
from app.schemas import AnalysisResult, CategoryResult

router = APIRouter()

def _read_imagefile(file) -> np.ndarray:
    """Read UploadFile as numpy array (BGR)."""
    contents = file.file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file")
    return img

@router.post("/analyze", response_model=AnalysisResult)
async def analyze_faces(
    frontal: UploadFile = File(...),
    left: UploadFile = File(...),
    right: UploadFile = File(...)
):
    """
    Expect three images: frontal, left lateral, right lateral.
    Returns analysis scores.
    """
    # Read images
    try:
        img_f = _read_imagefile(frontal)
        img_l = _read_imagefile(left)
        img_r = _read_imagefile(right)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Validate each image and get landmarks and shape
    results = {}
    errors = []
    for name, img in [("frontal", img_f), ("left", img_l), ("right", img_r)]:
        is_valid, err_list, landmarks, img_shape = validate_image(img)
        if not is_valid:
            errors.append(f"{name}: {', '.join(err_list)}")
        else:
            results[name] = {"landmarks": landmarks, "img_shape": img_shape}

    # If no valid images, return error result
    if not results:
        categories = [
            CategoryResult(name="Qualidade da Imagem", score=0.0, badge="Regular", error="Nenhuma imagem válida fornecida.")
        ]
        return AnalysisResult(overall_score=0.0, confidence=0.0, categories=categories)

    # Process each valid image
    scores_by_view = {}
    for name, data in results.items():
        landmarks = data["landmarks"]
        img_shape = data["img_shape"]
        # Convert landmarks to numpy array (N, 3)
        lm = np.array([[p.x, p.y, p.z] for p in landmarks.landmark], dtype=np.float32)
        # Compute raw measurements
        meas = compute_measurements(lm, img_shape)
        # Normalize to scores
        scores = normalize_measurements(meas)
        scores_by_view[name] = scores

    # Combine scores: average across views for each metric
    if not scores_by_view:
        categories = [CategoryResult(name="Erro", score=0.0, badge="Regular", error="Não foi possível processar as imagens.")]
        return AnalysisResult(overall_score=0.0, confidence=0.0, categories=categories)

    # Get all metric keys from the first entry
    sample_scores = next(iter(scores_by_view.values()))
    metric_keys = [k for k in sample_scores.keys() if isinstance(sample_scores[k], (int, float))]

    # Initialize accumulators
    summed_scores = {k: 0.0 for k in metric_keys}
    count = len(scores_by_view)

    for scores in scores_by_view.values():
        for k in metric_keys:
            summed_scores[k] += float(scores[k])

    avg_scores = {k: summed_scores[k] / count for k in metric_keys}

    # Map metric keys to label and compute badge
    category_map = {
        "proporcoes_gerais": "Proporções Gerais",
        "simetria_facial": "Simetria Facial",
        "olhos": "Olhos",
        "nariz": "Nariz",
        "boca": "Boca",
        "mandibula": "Mandíbula",
        "tercos_faciais": "Terços Faciais"
    }

    categories = []
    for key, label in category_map.items():
        if key in avg_scores:
            score = avg_scores[key]
            if score >= 90:
                badge = "Excelente"
            elif score >= 80:
                badge = "Muito Bom"
            elif score >= 70:
                badge = "Bom"
            else:
                badge = "Regular"
            # Error: none unless we want to propagate validation errors per category? We'll skip.
            categories.append(
                CategoryResult(name=label, score=round(score, 2), badge=badge, error=None)
            )

    # If there were validation errors, add a quality category
    if errors:
        error_msg = "; ".join(errors)
        categories.append(
            CategoryResult(name="Qualidade da Imagem", score=50.0, badge="Regular", error=error_msg)
        )

    # Overall score: average of all category scores (including quality if present)
    overall = sum([c.score for c in categories]) / len(categories) if categories else 0.0
    confidence = 95.0 if not errors else 70.0  # lower confidence if validation issues

    return AnalysisResult(
        overall_score=round(overall, 2),
        confidence=round(confidence, 2),
        categories=categories
    )