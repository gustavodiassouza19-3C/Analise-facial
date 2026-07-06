import numpy as np
import cv2
import logging

logger = logging.getLogger(__name__)

def compute_measurements(landmarks: np.ndarray, img_shape: tuple[int, int]) -> dict:
    """
    Compute facial measurements from MediaPipe landmarks.
    
    Args:
        landmarks: numpy array of shape (n_landmarks, 3) with normalized coordinates (x, y, z)
        img_shape: tuple (height, width) of the image in pixels
        
    Returns:
        Dictionary with raw measurements:
        - face_width: width of face oval in pixels
        - face_height: height of face oval in pixels
        - symmetry_error: average absolute deviation from midline (pixels)
        - eye_distance: distance between outer eye corners (pixels)
        - nose_to_chin: distance from nose tip to chin (pixels)
        - etc.
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
    eye_distance = np.linalg.norm(left_eye_outer - right_eye_outer)
    
    # Nose to chin distance
    nose_tip = landmarks_pixels[1]
    # Chin point: we can use the bottom of the face oval (max y)
    chin_point = landmarks_pixels[np.argmax(landmarks_pixels[:, 1])]
    nose_to_chin = np.linalg.norm(nose_tip - chin_point)
    
    # Mouth width: left corner (61) to right corner (291)
    mouth_left = landmarks_pixels[61]
    mouth_right = landmarks_pixels[291]
    mouth_width = np.linalg.norm(mouth_left - mouth_right)
    
    # Eye height: average of eye heights? We'll compute vertical distance between eyelids? Simpler: use eye landmark vertical spread.
    # For simplicity, we'll compute the average y of the top eyelid vs bottom? Not now.
    
    return {
        "face_width": float(face_width),
        "face_height": float(face_height),
        "symmetry_error": float(symmetry_error),
        "eye_distance": float(eye_distance),
        "nose_to_chin": float(nose_to_chin),
        "mouth_width": float(mouth_width),
    }