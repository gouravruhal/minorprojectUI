"""
VoiceShield AI Voice Analysis FastAPI Backend Server.
Production entrypoint for live audio streams, forensic uploads, and acoustic inference.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import CORS_ORIGINS, BACKEND_HOST, BACKEND_PORT
from backend.app.database.db import init_db
from backend.app.utils.temp_storage import cleanup_temp_dir
from backend.app.api.voice_routes import router as voice_router
from backend.app.api.health_routes import router as health_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and clean temp directory on startup
    init_db()
    cleanup_temp_dir()
    yield
    cleanup_temp_dir()

app = FastAPI(
    title="VoiceShield AI Voice Analysis Service",
    description="Real-time acoustic analysis, microphone streaming, and voice deepfake detection API.",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(voice_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=BACKEND_HOST, port=BACKEND_PORT, reload=True)

