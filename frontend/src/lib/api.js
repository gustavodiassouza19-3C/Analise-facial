const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Envia pontos anatômicos para a rota matemática do backend.
 * POST /api/v1/analysis/calculate-metrics
 *
 * @param {Object} points - 9 pontos faciais com { x, y }
 * @returns {Promise<Object>} - thirds, nasolabial_angle, ricketts
 */
export async function sendDataToBackend(points) {
  const body = {
    trichion:            { x: points.trichion.x,            y: points.trichion.y },
    glabella:            { x: points.glabella.x,            y: points.glabella.y },
    subnasale_front:     { x: points.subnasale_front.x,     y: points.subnasale_front.y },
    menton_front:        { x: points.menton_front.x,        y: points.menton_front.y },
    subnasale_profile:   { x: points.subnasale_profile.x,   y: points.subnasale_profile.y },
    pranasale:           { x: points.pranasale.x,           y: points.pranasale.y },
    labiale_superius:    { x: points.labiale_superius.x,    y: points.labiale_superius.y },
    labiale_inferius:    { x: points.labiale_inferius.x,    y: points.labiale_inferius.y },
    menton_profile:      { x: points.menton_profile.x,      y: points.menton_profile.y },
  };

  const response = await fetch(`${API_BASE}/analysis/calculate-metrics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Erro ao calcular métricas geométricas');
  }

  return response.json();
}

/**
 * Detecta o rosto na imagem e retorna a versao recortada.
 * POST /api/v1/analysis/detect-face
 *
 * @param {string} base64Image - data:image/...;base64,...
 * @returns {Promise<string>} - data:image/jpeg;base64,... (cropped)
 */
export async function detectFace(base64Image) {
  const response = await fetch(`${API_BASE}/analysis/detect-face`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Erro ao detectar rosto');
  }

  const data = await response.json();
  return data.cropped_image;
}
