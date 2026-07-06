from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import os
import shutil
from datetime import datetime

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
FACES_DIR = os.path.join(BASE_DIR, "faces")

def ensure_faces_dir():
    if not os.path.exists(FACES_DIR):
        os.makedirs(FACES_DIR)

@router.post("/save-frame")
async def save_file(file: UploadFile = File(...)):
    """
    Save an uploaded image file to the faces directory with a timestamp.
    """
    ensure_faces_dir()
    # Validate file type (optional)
    if file.content_type is None or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    # Generate filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S%f")
    filename = f"face_{timestamp}.png"
    file_path = os.path.join(FACES_DIR, filename)
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {e}")
    finally:
        file.file.close()
    return JSONResponse(content={"message": "File saved successfully", "filename": filename, "path": file_path})

@router.delete("/clear-frames")
async def clear_frames():
    """
    Delete all files in the faces directory.
    """
    ensure_faces_dir()
    deleted = []
    errors = []
    for entry in os.listdir(FACES_DIR):
        file_path = os.path.join(FACES_DIR, entry)
        try:
            if os.path.isfile(file_path):
                os.unlink(file_path)
                deleted.append(file_path)
        except Exception as e:
            errors.append(f"{file_path}: {str(e)}")
    if errors:
        return JSONResponse(status_code=500, content={"errors": errors, "deleted": deleted})
    return JSONResponse(content={"message": f"Cleared {len(deleted)} files from faces directory", "deleted": deleted})