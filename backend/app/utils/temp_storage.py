"""
Temporary audio storage and automatic cleanup utilities.
"""
import os
import uuid
from backend.app.core.config import TEMP_UPLOAD_DIR

def save_temp_audio(data: bytes, ext: str = ".wav") -> str:
    """Saves uploaded audio bytes to a temporary file path."""
    os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)
    filename = f"upload_{uuid.uuid4().hex[:12]}{ext}"
    path = os.path.join(TEMP_UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(data)
    return path

def remove_temp_file(filepath: str):
    """Safely removes a temporary file."""
    if filepath and os.path.exists(filepath):
        try:
            os.remove(filepath)
        except Exception:
            pass

def cleanup_temp_dir():
    """Removes all leftover temporary files in upload directory."""
    if os.path.exists(TEMP_UPLOAD_DIR):
        for f in os.listdir(TEMP_UPLOAD_DIR):
            p = os.path.join(TEMP_UPLOAD_DIR, f)
            remove_temp_file(p)

