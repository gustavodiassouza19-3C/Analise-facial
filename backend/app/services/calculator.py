import numpy as np
import cv2
import logging

logger = logging.getLogger(__name__)

def _distance(p1, p2):
    return np.linalg.norm(p1 - p2)

def compute_measurements(landmarks: np.ndarray, img_shape: tuple[int, int]) -> dict:
    """
    Compute facial measurements from MediaPipe landmarks.
    
    Args:
        landmarks: numpy array of shape (n_landmarks, 3) with normalized coordinates (x, y, z)
        img_shape: tuple (height, width) of the image in pixels
        
    Returns:
        Dictionary with raw measurements in pixels.
    """
    height, width = img_shape
    
    # Convert normalized coordinates to pixel coordinates
    landmarks_pixels = landmarks.copy()
    landmarks_pixels[:, 0] *= width   # x coordinates
    landmarks_pixels[:, 1] *= height  # y coordinates
    
    # Face oval points (first 17 points in MediaPipe face mesh)
    face_oval_indices = list(range(0, 17))
    face_oval = landmarks_pixels[face_oval_indices]
    
    # Compute bounding box of face oval
    x_min, y_min = np.min(face_oval[:, :2], axis=0)
    x_max, y_max = np.max(face_oval[:, :2], axis=0)
    face_width = x_max - x_min
    face_height = y_max - y_min
    
    # Midline: using nose tip (index 1) and chin (point with max y in face oval)
    chin_idx = np.argmax(face_oval[:, 1])  # index in face_oval array
    chin_point = face_oval[chin_idx]
    nose_tip = landmarks_pixels[1]  # index 1 is nose tip
    
    # Midline x-coordinate: average of nose tip and chin x
    midline_x = (nose_tip[0] + chin_point[0]) / 2.0
    
    # Calculate horizontal distance from midline for each point in face oval
    distances_to_midline = np.abs(face_oval[:, 0] - midline_x)
    
    # Split face oval into left and right sides based on x position relative to midline
    left_mask = face_oval[:, 0] < midline_x
    right_mask = ~left_mask
    
    # Average distance for left and right sides
    left_avg = np.mean(distances_to_midline[left_mask]) if np.any(left_mask) else 0.0
    right_avg = np.mean(distances_to_midline[right_mask]) if np.any(right_mask) else 0.0
    
    # Symmetry error: absolute difference between average distances
    symmetry_error = abs(left_avg - right_avg)
    
    # Eye distance: outer corners (left eye: 33, right eye: 263)
    left_eye_outer = landmarks_pixels[33]
    right_eye_outer = landmarks_pixels[263]
    eye_distance = _distance(left_eye_outer, right_eye_outer)
    
    # Inner eye corners (approximate nose width)
    left_eye_inner = landmarks_pixels[133]  # left eye inner corner
    right_eye_inner = landmarks_pixels[362] # right eye inner corner
    nose_width = _distance(left_eye_inner, right_eye_inner)
    
    # Mouth width: left corner (61) to right corner (291)
    mouth_left = landmarks_pixels[61]
    mouth_right = landmarks_pixels[291]
    mouth_width = _distance(mouth_left, mouth_right)
    
    # Nose tip to upper lip (approximate): nose tip to point 13 (upper lip?)
    # Upper lip center is point 13? Actually upper lip is between 13 and 14.
    # We'll use point 13 as upper lip center.
    upper_lip = landmarks_pixels[13]
    nose_upper_lip_dist = _distance(nose_tip, upper_lip)
    
    # Mouth height: distance between upper lip (13) and lower lip (14)
    lower_lip = landmarks_pixels[14]
    mouth_height = _distance(upper_lip, lower_lip)
    
    # Forehead height: we don't have trichion, so we'll approximate using forehead point? 
    # We'll skip for now.
    
    return {
        "face_width": float(face_width),
        "face_height": float(face_height),
        "symmetry_error": float(symmetry_error),
        "eye_distance": float(eye_distance),
        "nose_width": float(nose_width),
        "mouth_width": float(mouth_width),
        "mouth_height": float(mouth_height),
        "nose_upper_lip_dist": float(nose_upper_lip_dist),
    }

def normalize_measurements(measurements: dict) -> dict:
    """
    Convert raw measurements to scores (0-100) using Gaussian-like functions.
    
    Args:
        measurements: dictionary from compute_measurements
        
    Returns:
        Dictionary with scores for various categories:
        - proporcoes_gerais: based on face height/width ratio
        - simetria_facial: based on symmetry error
        - olhos: based on eye distance / face width ratio
        - nariz: based on nose width / face width ratio
        - boca: based on mouth width / face width ratio
        - Other categories (mandibula, tercos_faciais) will be derived from combinations.
    """
    # Extract measurements
    face_width = measurements["face_width"]
    face_height = measurements["face_height"]
    symmetry_error = measurements["symmetry_error"]
    eye_distance = measurements["eye_distance"]
    nose_width = measurements["nose_width"]
    mouth_width = measurements["mouth_width"]
    
    # Avoid division by zero
    if face_width == 0:
        face_width = 1.0
    
    # 1. Proporções Gerais (height/width ratio)
    # Ideal oval face ratio is approximately 1.5 (height is 1.5 times width)
    ratio = face_height / face_width
    ideal_ratio = 1.5
    sigma_ratio = 0.2
    proporcoes_gerais = 100.0 * np.exp(-0.5 * ((ratio - ideal_ratio) / sigma_ratio) ** 2)
    
    # 2. Simetria Facial (symmetry error in pixels)
    sigma_sym = 15.0
    simetria_facial = 100.0 * np.exp(-0.5 * (symmetry_error / sigma_sym) ** 2)
    
    # 3. Olhos (eye distance / face width ratio)
    # Ideal inter-ocular distance is about 0.45 * face width
    eye_ratio = eye_distance / face_width
    ideal_eye_ratio = 0.45
    sigma_eye = 0.05
    olhos = 100.0 * np.exp(-0.5 * ((eye_ratio - ideal_eye_ratio) / sigma_eye) ** 2)
    
    # 4. Nariz (nose width / face width ratio)
    # Ideal nose width is about 0.25 * face width
    nose_ratio = nose_width / face_width
    ideal_nose_ratio = 0.25
    sigma_nose = 0.05
    nariz = 100.0 * np.exp(-0.5 * ((nose_ratio - ideal_nose_ratio) / sigma_nose) ** 2)
    
    # 5. Boca (mouth width / face width ratio)
    # Ideal mouth width is about 0.5 * face width
    mouth_ratio = mouth_width / face_width
    ideal_mouth_ratio = 0.5
    sigma_mouth = 0.05
    boca = 100.0 * np.exp(-0.5 * ((mouth_ratio - ideal_mouth_ratio) / sigma_mouth) ** 2)
    
    # 6. Mandíbula (jaw) - we can approximate using jaw width? 
    # We don't have direct jaw width, but we can use the width at the bottom of the face oval.
    # For simplicity, we'll use the same as boca or compute a placeholder.
    # We'll set mandibula to the average of nariz and boca for now.
    mandibula = (nariz + boca) / 2.0
    
    # 7. Terços Faciais (vertical thirds)
    # We need trichion (hairline), glabella (between eyebrows), subnasale (base of nose), pogonion (chin).
    # We don't have trichion. We'll approximate using forehead height from the top of the face oval to the eyebrows?
    # Since we lack reliable landmarks, we'll compute a placeholder as the average of the other scores.
    # Alternatively, we can compute the ratio of upper face height (eyebrow to chin?) but we'll skip.
    # We'll set tercos_faciais to the average of proporcoes_gerais and simetria_facial for now.
    tercos_faciais = (proporcoes_gerais + simetria_facial) / 2.0
    
    # Ensure scores are within 0-100
    def clamp(x):
        return max(0.0, min(100.0, x))
    
    proporcoes_gerais = clamp(proporcoes_gerais)
    simetria_facial = clamp(simetria_facial)
    olhos = clamp(olhos)
    nariz = clamp(nariz)
    boca = clamp(boca)
    mandibula = clamp(mandibula)
    tercos_faciais = clamp(tercos_faciais)
    
    return {
        "proporcoes_gerais": round(proporcoes_gerais, 2),
        "simetria_facial": round(simetria_facial, 2),
        "olhos": round(olhos, 2),
        "nariz": round(nariz, 2),
        "boca": round(boca, 2),
        "mandibula": round(mandibula, 2),
        "tercos_faciais": round(tercos_faciais, 2),
    }