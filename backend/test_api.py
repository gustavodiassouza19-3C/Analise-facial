import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_analyze_endpoint():
    # Create a dummy black image (100x100x3) as a JPEG in memory
    import numpy as np
    import cv2
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    _, buf = cv2.imencode('.jpg', img)
    files = {
        'frontal': ('test.jpg', buf.tobytes(), 'image/jpeg'),
        'left': ('test.jpg', buf.tobytes(), 'image/jpeg'),
        'right': ('test.jpg', buf.tobytes(), 'image/jpeg')
    }
    response = client.post("/api/v1/analyze", files=files)
    print("Status code:", response.status_code)
    print("Response JSON:", response.json())
    return response

if __name__ == "__main__":
    try:
        resp = test_analyze_endpoint()
        print("Test passed.")
    except Exception as e:
        print("Test failed:", e)
        import traceback
        traceback.print_exc()