import cv2
import numpy as np
import mediapipe as mp
import logging
import os
import urllib.request
from typing import Tuple, List, Optional

logger = logging.getLogger(__name__)

def get_model_path() -> str:
    """
    Get the absolute path to the face landmarker model file.
    Downloads it if necessary.
    """
    # Define the model directory and path
    model_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'models')
    model_dir = os.path.abspath(model_dir)
    model_path = os.path.join(model_dir, 'face_landmarker.task')
    
    # If the model already exists, return it
    if os.path.exists(model_path):
        return model_path
    
    # Otherwise, download the model
    os.makedirs(model_dir, exist_ok=True)
    model_url = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
    try:
        logger.info(f"Downloading face landmarker model from {model_url} to {model_path}")
        urllib.request.urlretrieve(model_url, model_path)
        logger.info("Download completed.")
        return model_path
    except Exception as e:
        logger.error(f"Failed to download model: {e}")
        # If download fails, we cannot proceed
        raise RuntimeError(f"Could not download the face landmarker model: {e}")

# Initialize the FaceLandmarker
try:
    model_path = get_model_path()
    base_options = mp.tasks.BaseOptions(model_asset_path=model_path)
    options = mp.tasks.vision.FaceLandmarkerOptions(
        base_options=base_options,
        running_mode=mp.tasks.vision.RunningMode.IMAGE,
        num_faces=1,
        min_face_detection_confidence=0.5,
        min_face_presence_confidence=0.5,
        min_tracking_confidence=0.5,
        output_face_blendshapes=False,
        output_facial_transformation_matrixes=False,
    )
    detector = mp.tasks.vision.FaceLandmarker.create_from_options(options)
except Exception as e:
    logger.error(f"Failed to initialize FaceLandmarker: {e}")
    # We'll set detector to None and handle it later
    detector = None

def validate_image(image: np.ndarray) -> tuple[bool, list[str], Optional[object], Optional[tuple[int, int]]]:
    """
    Validate an image for face capture quality.
    Returns (is_valid, list_of_error_messages, landmarks, image_shape)
    If not valid, landmarks and image_shape are None.
    """
    if detector is None:
        return False, ["Face landmarker not initialized. Check server logs."], None, None

    errors = []
    
    # Convert to RGB for MediaPipe
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    # MediaPipe expects an Image object
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
    
    # Detect face landmarks
    try:
        detection_result = detector.detect(mp_image)
    except Exception as e:
        logger.error(f"Error during face detection: {e}")
        return False, [f"Detection error: {str(e)}"], None, None
    
    if not detection_result.face_landmarks:
        errors.append("Nenhum rosto detectado na imagem")
        return False, errors, None, None
    
    # Assume only one face
    landmarks = detection_result.face_landmarks[0]  # This is a list of NormalizedLandmark
    
    # Get image dimensions
    img_h, img_w = image.shape[:2]
    
    # Convert landmark normalized coordinates to pixel coordinates
    x_coords = []
    y_coords = []
    for landmark in landmarks:
        x_coords.append(landmark.x * img_w)
        y_coords.append(landmark.y * img_h)
    
    # Compute bounding box
    x_min = int(min(x_coords))
    x_max = int(max(x_coords))
    y_min = int(min(y_coords))
    y_max = int(max(y_coords))
    
    box_width = x_max - x_min
    box_height = y_max - y_min
    
    # Check minimum size
    if box_width < 100 or box_height < 100:
        errors.append(f"Rosto muito pequeno na imagem (largura: {box_width}px, altura: {box_height}px). Mínimo: 100x100px.")
    
    # Check that the bounding box is within the image (with a small margin)
    if x_min < 0 or y_min < 0 or x_max > img_w or y_max > img_h:
        errors.append("O rosto está parcialmente fora da imagem.")
    
    # Check brightness
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    mean_brightness = np.mean(gray)
    if mean_brightness < 50:
        errors.append("Imagem muito escura (baixa luminosidade).")
    elif mean_brightness > 200:
        errors.append("Imagem muito clara (alta luminosidade).")
    
    # Check blur (using Laplacian variance)
    blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
    if blur_score < 100.0:  # This threshold may need tuning
        errors.append("Imagem muito borrada.")
    
    # TODO: Add pose check (yaw, pitch, roll) if time permits.
    
    is_valid = len(errors) == 0
    return is_valid, errors, landmarks, (img_h, img_w)