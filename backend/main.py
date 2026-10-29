"""
VoiceShield AI Voice Analysis FastAPI Server.
Entrypoint for real-time acoustic analysis, telephony streams, and forensic file inspection.
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import CORS_ORIGINS, BACKEND_HOST, BACKEND_PORT
from backend.routes import router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("voiceshield_api")

app = FastAPI(
    title="VoiceShield AI Voice Analysis Service",
    description="Real-time acoustic analysis and voice impersonation detection service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/api/health")
async def health_check():
    """Health check endpoint to verify backend service readiness."""
    return {
        "status": "online",
        "service": "VoiceShield AI Voice Analysis",
        "version": "1.0.0",
        "endpoints": {
            "sessions": "/api/voice-analysis/sessions",
            "telecom_connect": "/api/voice-analysis/telecom/connect",
            "recordings": "/api/voice-analysis/recordings",
            "websocket": "/ws/voice-analysis/{session_id}"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=BACKEND_HOST, port=BACKEND_PORT, reload=True)
