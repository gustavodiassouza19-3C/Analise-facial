export const API_BASE = import.meta.env.DEV ? '/api/v1' : (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1');

/**
 * Envia 1 foto frontal para análise via DeepSeek.
 * POST /api/v1/analyze/
 *
 * @param {string} photoFront - Base64 da foto frontal
 * @param {string} token      - JWT de autenticação
 * @returns {Promise<Object>} - Resultado da análise
 */
export async function analyzeWithAI(photoFront, token) {
  const response = await fetch(`${API_BASE}/analyze/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      photo_front: photoFront,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Erro ao analisar rosto');
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
