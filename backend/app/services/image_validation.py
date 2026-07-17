import io
import logging
from PIL import Image
from fastapi import status
from app.core.exceptions import SanitizedHTTPException

logger = logging.getLogger(__name__)

_MAGIC_BYTES = {
    b"\xff\xd8\xff\xe0": "JPEG",
    b"\xff\xd8\xff\xe1": "JPEG",
    b"\xff\xd8\xff\xe2": "JPEG",
    b"\xff\xd8\xff\xdb": "JPEG",
    b"\x89PNG": "PNG",
    b"RIFF": "WEBP",
}

MIN_DIMENSION = 200
MAX_DIMENSION = 8192


def validate_and_clean_image(image_bytes: bytes, max_size_mb: int = 10) -> bytes:
    """Validate image via magic bytes, strip EXIF/metadata, re-encode as clean JPEG."""
    if len(image_bytes) > max_size_mb * 1024 * 1024:
        raise SanitizedHTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"Imagem excede o limite de {max_size_mb}MB.",
            f"Image size: {len(image_bytes)} bytes",
        )

    header = image_bytes[:4]
    detected_type = None
    for signature, mime_type in _MAGIC_BYTES.items():
        if header.startswith(signature):
            detected_type = mime_type
            break

    if detected_type is None:
        raise SanitizedHTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Arquivo nao e uma imagem valida. Use JPG, PNG ou WebP.",
            f"Magic bytes: {header.hex()}",
        )

    try:
        img = Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        logger.warning("Pillow failed to open image: %s", e)
        raise SanitizedHTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Arquivo de imagem corrompido ou invalido.",
            str(e),
        )

    width, height = img.size
    if width < MIN_DIMENSION or height < MIN_DIMENSION:
        raise SanitizedHTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"Imagem muito pequena. Minimo: {MIN_DIMENSION}x{MIN_DIMENSION}px.",
            f"Dimensions: {width}x{height}",
        )

    if width > MAX_DIMENSION or height > MAX_DIMENSION:
        raise SanitizedHTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"Imagem muito grande. Maximo: {MAX_DIMENSION}x{MAX_DIMENSION}px.",
            f"Dimensions: {width}x{height}",
        )

    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=92, optimize=True)
    clean_bytes = buffer.getvalue()

    logger.info(
        "Image validated: type=%s, original=%d bytes, cleaned=%d bytes, dims=%dx%d",
        detected_type, len(image_bytes), len(clean_bytes), width, height,
    )
    return clean_bytes
