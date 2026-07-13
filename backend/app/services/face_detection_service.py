import base64
import cv2
import numpy as np


class FaceDetectionService:
    """
    Detects faces in images and crops around them with uniform padding.
    Uses OpenCV Haar Cascade for face detection.
    """

    OUTPUT_WIDTH = 400
    OUTPUT_HEIGHT = 540  # 3:4 aspect ratio
    PADDING_RATIO = 0.3  # 30% padding around face

    def __init__(self):
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        self.face_cascade = cv2.CascadeClassifier(cascade_path)

    def detect_and_crop(self, base64_image: str) -> str:
        """
        Receives a base64 image, detects the face, crops around it
        with uniform padding, and returns the cropped base64 image.

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

        # Detect faces
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(80, 80),
        )

        if len(faces) == 0:
            raise ValueError("Nenhum rosto detectado na imagem")

        # Use the largest face
        fx, fy, fw, fh = max(faces, key=lambda f: f[2] * f[3])

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
        # while staying within image bounds and covering the face
        target_ratio = self.OUTPUT_WIDTH / self.OUTPUT_HEIGHT  # 0.75 (width/height)

        img_h, img_w = image.shape[:2]

        # Start with the base size and adjust to exact 3:4 ratio
        # Use the larger dimension as the constraint
        if base_w / base_h < target_ratio:
            # Height limited - calculate width from height
            crop_h = min(base_h, img_h)
            crop_w = int(crop_h * target_ratio)
        else:
            # Width limited - calculate height from width
            crop_w = min(base_w, img_w)
            crop_h = int(crop_w / target_ratio)

        # Ensure we don't exceed image boundaries
        if crop_w > img_w:
            crop_w = img_w
            crop_h = int(crop_w / target_ratio)
        if crop_h > img_h:
            crop_h = img_h
            crop_w = int(crop_h * target_ratio)

        # Calculate crop coordinates centered on the face
        x1 = face_center_x - crop_w // 2
        y1 = face_center_y - crop_h // 2

        # Clamp to image boundaries
        x1 = max(0, min(x1, img_w - crop_w))
        y1 = max(0, min(y1, img_h - crop_h))

        x2 = x1 + crop_w
        y2 = y1 + crop_h

        # Final safety check
        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(img_w, x2)
        y2 = min(img_h, y2)

        # Crop (guaranteed to have correct aspect ratio)
        cropped = image[y1:y2, x1:x2]

        # Verify aspect ratio before resize
        actual_h, actual_w = cropped.shape[:2]
        if actual_w == 0 or actual_h == 0:
            raise ValueError("Invalid crop dimensions")

        # Resize to exact output dimensions (no distortion since ratio matches)
        resized = cv2.resize(cropped, (self.OUTPUT_WIDTH, self.OUTPUT_HEIGHT), interpolation=cv2.INTER_AREA)

        # Encode back to base64
        _, buffer = cv2.imencode(".jpg", resized, [cv2.IMWRITE_JPEG_QUALITY, 90])
        cropped_base64 = base64.b64encode(buffer).decode("utf-8")

        return f"data:image/jpeg;base64,{cropped_base64}"
