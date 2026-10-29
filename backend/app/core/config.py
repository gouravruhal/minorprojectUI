"""
Application configuration for the VoiceShield AI backend server.
"""
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATABASE_PATH = os.getenv("VOICESHIELD_DB_PATH", os.path.join(BASE_DIR, "voiceshield.db"))
TEMP_UPLOAD_DIR = os.getenv("VOICESHIELD_TEMP_DIR", os.path.join(BASE_DIR, "temp_uploads"))

BACKEND_HOST = os.getenv("VOICESHIELD_HOST", "0.0.0.0")
BACKEND_PORT = int(os.getenv("VOICESHIELD_PORT", "8000"))

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB
SUPPORTED_EXTENSIONS = {".wav", ".mp3", ".webm", ".ogg", ".flac", ".m4a"}

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]
