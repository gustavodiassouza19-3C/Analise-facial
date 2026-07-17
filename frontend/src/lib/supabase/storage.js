import { createClient } from './client';

const BUCKET = 'analysis-photos';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const VALID_SIGNATURES = {
  'ffd8ffe0': true, 'ffd8ffe1': true, 'ffd8ffe2': true, 'ffd8ffdb': true, // JPEG
  '89504e47': true, // PNG
  '52494646': true, // WebP (RIFF header)
};

export function validateImageSize(file) {
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Imagem muito grande (${sizeMB}MB). O limite e 5MB.`,
    };
  }
  return { valid: true };
}

export async function validateMagicBytes(dataUrl) {
  try {
    const response = await fetch(dataUrl);
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer).slice(0, 4);
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return Object.keys(VALID_SIGNATURES).some(sig => hex.startsWith(sig));
  } catch {
    return false;
  }
}

export async function uploadAnalysisPhoto(userId, analysisId, slot, file) {
  const supabase = createClient();

  const validation = validateImageSize(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${analysisId}_${slot}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type || 'image/jpeg',
      upsert: true,
    });

  if (error) {
    throw new Error(`Falha no upload: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return urlData.publicUrl;
}

export async function uploadAnalysisPhotos(userId, analysisId, photos) {
  const slots = ['front', 'left', 'right', 'body'];
  const urls = {};
  const uploadedPaths = [];

  try {
    for (const slot of slots) {
      const file = photos[slot];
      if (!file) continue;

      const blob = await fetch(file).then((r) => r.blob());
      const ext = blob.type.includes('png') ? 'png' : 'jpg';
      const fileObj = new File([blob], `${slot}.${ext}`, { type: blob.type });

      const url = await uploadAnalysisPhoto(userId, analysisId, slot, fileObj);
      urls[`photo_${slot}_url`] = url;
      uploadedPaths.push(`${userId}/${analysisId}_${slot}.${ext}`);
    }

    return urls;
  } catch (err) {
    // Cleanup: remove all files that were already uploaded
    if (uploadedPaths.length > 0) {
      const supabase = createClient();
      await Promise.allSettled(
        uploadedPaths.map(path =>
          supabase.storage.from(BUCKET).remove([path])
        )
      );
    }
    throw err;
  }
}
