"""
API routes for Voice Analysis: live microphone streaming, file upload, and session control.
"""
import json
import numpy as np
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, WebSocket, WebSocketDisconnect

from backend.app.schemas.voice_schemas import CreateSessionRequest, SessionResponse, AnalysisResponse
from backend.app.services.session_service import session_service
from backend.app.services.voice_service import analyze_audio_file, analyze_streaming_chunk
from backend.app.database import repository
from backend.app.utils.temp_storage import save_temp_audio, remove_temp_file
from backend.app.core.config import MAX_FILE_SIZE_BYTES
from AI.preprocessing.audio_normalizer import decode_audio_bytes

router = APIRouter()

@router.post("/api/voice/live/sessions", response_model=SessionResponse)
@router.post("/api/voice-analysis/sessions", response_model=SessionResponse)
async def create_live_session(req: CreateSessionRequest):
    """Creates a new authorized voice analysis session."""
    if not req.user_consent:
        raise HTTPException(status_code=400, detail="User consent is required before capturing audio.")
    return session_service.start_session(
        mode=req.mode, audio_source=req.audio_source,
        user_consent=req.user_consent, phone_number=req.phone_number
    )

@router.post("/api/voice/live/{session_id}/stop")
async def stop_live_session(session_id: str):
    """Stops an active session and releases streaming resources."""
    success = session_service.stop_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found.")
    return {"status": "stopped", "session_id": session_id}

@router.post("/api/voice/upload", response_model=AnalysisResponse)
@router.post("/api/voice-analysis/recordings", response_model=AnalysisResponse)
async def upload_audio_recording(
    file: UploadFile = File(...),
    consent: bool = Form(True),
    session_id: str = Form(None)
):
    """Uploads, validates, and analyzes recorded audio file (WAV, MP3, WebM, FLAC)."""
    if not consent:
        raise HTTPException(status_code=400, detail="Recording analysis requires user consent confirmation.")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds maximum allowed size of 25MB.")
    if len(contents) < 512:
        raise HTTPException(status_code=400, detail="Audio file is empty or corrupted.")

    temp_path = save_temp_audio(contents, ext="." + file.filename.split(".")[-1])
    try:
        report = analyze_audio_file(contents=contents, filename=file.filename, session_id=session_id)
        return report
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process audio file: {str(e)}")
    finally:
        remove_temp_file(temp_path)

@router.get("/api/voice/analysis/{analysis_id}", response_model=AnalysisResponse)
@router.get("/api/voice/analysis/{analysis_id}/results", response_model=AnalysisResponse)
async def get_analysis_result(analysis_id: str):
    """Retrieves an existing analysis report and segment results by ID."""
    record = repository.get_analysis(analysis_id)
    if not record:
        raise HTTPException(status_code=404, detail="Analysis report not found.")
    return record

@router.websocket("/api/voice/live/{session_id}")
@router.websocket("/ws/voice-analysis/{session_id}")
async def voice_analysis_websocket(websocket: WebSocket, session_id: str):
    """High-speed WebSocket endpoint for live microphone audio chunk streaming and ongoing inference."""
    await websocket.accept()
    session = session_service.get_session(session_id)
    if not session:
        session = session_service.start_session(session_id, mode="microphone", user_consent=True)

    session_service.register_socket(session_id, websocket)

    try:
        while True:
            message = await websocket.receive()
            if "bytes" in message and message["bytes"]:
                raw_bytes = message["bytes"]
                try:
                    samples, sr = decode_audio_bytes(raw_bytes)
                except Exception:
                    int_samples = np.frombuffer(raw_bytes, dtype=np.int16)
                    samples = int_samples.astype(np.float32) / 32768.0
                    sr = 16000

                result = analyze_streaming_chunk(samples, sr=sr, session_id=session_id)
                await websocket.send_json(result)

            elif "text" in message and message["text"]:
                try:
                    payload = json.loads(message["text"])
                    if payload.get("action") == "stop":
                        session_service.stop_session(session_id)
                        await websocket.send_json({"status": "stopped", "session_id": session_id})
                        break
                except json.JSONDecodeError:
                    pass

    except WebSocketDisconnect:
        session_service.stop_session(session_id)
    finally:
        session_service.unregister_socket(session_id, websocket)

