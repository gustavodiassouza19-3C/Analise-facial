import base64
import cv2
import numpy as np
import mediapipe as mp


class FaceDetectionService:
    """
    Detects faces in images using MediaPipe FaceMesh and crops around
    them with uniform padding to a 3:4 aspect ratio.
    """

    OUTPUT_WIDTH = 400
    OUTPUT_HEIGHT = 540  # 3:4 aspect ratio
    PADDING_RATIO = 0.3  # 30% padding around face

    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh

    def _compute_bbox(self, landmarks, img_w: int, img_h: int):
        """Compute bounding box from MediaPipe face landmarks."""
        min_x = min_y = float("inf")
        max_x = max_y = float("-inf")
        for lm in landmarks:
            px = lm.x * img_w
            py = lm.y * img_h
            if px < min_x:
                min_x = px
            if py < min_y:
                min_y = py
            if px > max_x:
                max_x = px
            if py > max_y:
                max_y = py
        return int(min_x), int(min_y), int(max_x - min_x), int(max_y - min_y)

    def detect_and_crop(self, base64_image: str) -> str:
        """
        Receives a base64 image, detects the face using MediaPipe FaceMesh,
        crops around it with uniform padding, and returns the cropped base64 image.

        Args:
            base64_image: data:image/...;base64,... string

        Returns:
            data:image/jpeg;base64,... string of the cropped face

        Raises:
            ValueError: if no face is detected
        """
        # Decode base64 to numpy array
        image_data = base64.b64decode(base64_image.split(",")[-1])
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            raise ValueError("Could not decode image")

        img_h, img_w = image.shape[:2]

        # Detect face with MediaPipe FaceMesh
        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        with self.mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            min_detection_confidence=0.5,
        ) as face_mesh:
            results = face_mesh.process(rgb)

        if not results.multi_face_landmarks:
            raise ValueError("Nenhum rosto detectado na imagem")

        landmarks = results.multi_face_landmarks[0].landmark

        # Get bounding box from landmarks
        fx, fy, fw, fh = self._compute_bbox(landmarks, img_w, img_h)

        # Calculate face center
        face_center_x = fx + fw // 2
        face_center_y = fy + fh // 2

        # Calculate padded size based on face dimensions
        pad_w = int(fw * self.PADDING_RATIO)
        pad_h = int(fh * self.PADDING_RATIO)
        base_w = fw + 2 * pad_w
        base_h = fh + 2 * pad_h

        # Ensure minimum size
        base_w = max(base_w, 100)
        base_h = max(base_h, 100)

        # Calculate the maximum crop that fits the target aspect ratio (3:4)
        target_ratio = self.OUTPUT_WIDTH / self.OUTPUT_HEIGHT  # 0.75 (width/height)

        if base_w / base_h < target_ratio:
            crop_h = min(base_h, img_h)
            crop_w = int(crop_h * target_ratio)
        else:
            crop_w = min(base_w, img_w)
            crop_h = int(crop_w / target_ratio)

        if crop_w > img_w:
            crop_w = img_w
            crop_h = int(crop_w / target_ratio)
        if crop_h > img_h:
            crop_h = img_h
            crop_w = int(crop_h * target_ratio)

        x1 = face_center_x - crop_w // 2
        y1 = face_center_y - crop_h // 2

        x1 = max(0, min(x1, img_w - crop_w))
        y1 = max(0, min(y1, img_h - crop_h))

        x2 = x1 + crop_w
        y2 = y1 + crop_h

        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(img_w, x2)
        y2 = min(img_h, y2)

        cropped = image[y1:y2, x1:x2]

        actual_h, actual_w = cropped.shape[:2]
        if actual_w == 0 or actual_h == 0:
            raise ValueError("Invalid crop dimensions")

        resized = cv2.resize(cropped, (self.OUTPUT_WIDTH, self.OUTPUT_HEIGHT), interpolation=cv2.INTER_AREA)

        _, buffer = cv2.imencode(".jpg", resized, [cv2.IMWRITE_JPEG_QUALITY, 90])
        cropped_base64 = base64.b64encode(buffer).decode("utf-8")

        return f"data:image/jpeg;base64,{cropped_base64}"
