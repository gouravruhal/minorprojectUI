"""
Health check and system diagnostics endpoints.
"""
from fastapi import APIRouter
from backend.app.schemas.voice_schemas import HealthResponse
from backend.app.database.db import get_connection
from backend.app.services.voice_service import detector

router = APIRouter()

@router.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Verify backend API, database connectivity, and AI model readiness."""
    db_status = "offline"
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1;")
            db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    model_status = "loaded" if detector.model.is_fitted else "ready_heuristic"

    return {
        "status": "online",
        "service": "VoiceShield AI Voice Analysis Service",
        "version": "2.0.0",
        "database": db_status,
        "model": model_status
    }

