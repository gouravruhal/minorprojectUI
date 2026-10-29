"""
API routes for Voice Analysis sessions, telephony control, file uploads, and WebSockets.
"""
import json
import logging
from typing import Optional
import numpy as np
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, WebSocket, WebSocketDisconnect, Response
from pydantic import BaseModel

from backend.session_manager import session_manager
from backend.telecom_service import telecom_service
from backend.audio_dsp import decode_audio_bytes
from backend.voice_detector import classify_voice_segment
from backend.config import get_india_telecom_notice

logger = logging.getLogger("api_routes")
router = APIRouter()

class CreateSessionRequest(BaseModel):
    mode: str = "telecom"  # 'telecom' | 'microphone' | 'recording'
    audio_source: str = "laptop_microphone"  # 'twilio_provider' | 'laptop_microphone' | 'audio_interface'
    user_consent: bool = False
    phone_number: Optional[str] = None

class TelecomConnectRequest(BaseModel):
    session_id: Optional[str] = None
    phone_number: str
    consent_granted: bool

class TelecomDisconnectRequest(BaseModel):
    session_id: str

@router.post("/api/voice-analysis/sessions")
async def create_session(req: CreateSessionRequest):
    """Create an authorized voice analysis session with recorded consent status."""
    session = session_manager.create_session(
        mode=req.mode,
        audio_source=req.audio_source,
        user_consent=req.user_consent,
        phone_number=req.phone_number
    )
    return session.to_dict()

@router.get("/api/voice-analysis/sessions/{session_id}")
async def get_session(session_id: str):
    """Retrieve active session status."""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    return session.to_dict()

@router.get("/api/voice-analysis/telecom/status")
async def get_telecom_status():
    """Retrieve telephony provider status and regional telecommunications compliance."""
    return telecom_service.get_provider_status()

@router.post("/api/voice-analysis/telecom/connect")
async def connect_telecom(req: TelecomConnectRequest):
    """Initiate a supported telephony provider stream."""
    if not req.consent_granted:
        raise HTTPException(
            status_code=400,
            detail="User consent is required before initiating audio capture or telephony streams."
        )

    result = telecom_service.initiate_telecom_stream(
        phone_number=req.phone_number,
        consent_granted=req.consent_granted
    )

    if req.session_id:
        new_state = "connected" if result.get("success") else "error"
        session_manager.update_state(req.session_id, new_state)

    return result

@router.post("/api/voice-analysis/telecom/disconnect")
async def disconnect_telecom(req: TelecomDisconnectRequest):
    """Stop active telephony connection."""
    session = session_manager.get_session(req.session_id)
    if session:
        session_manager.update_state(req.session_id, "stopped")
    return {"success": True, "message": "Telephony session terminated."}

@router.post("/api/voice-analysis/telecom/twiml")
async def twilio_twiml_webhook():
    """Twilio Voice webhook returning TwiML to attach Media Streams."""
    twiml_xml = telecom_service.generate_twiml_response(
        stream_url="wss://your-domain.com/ws/telecom/media-stream"
    )
    return Response(content=twiml_xml, media_type="application/xml")

@router.post("/api/voice-analysis/recordings")
async def upload_recording_for_analysis(
    file: UploadFile = File(...),
    consent: bool = Form(True)
):
    """
    Upload and analyze recorded audio (WAV, MP3, WebM).
    Validates format, size, duration, and returns acoustic forensic analysis.
    """
    if not consent:
        raise HTTPException(status_code=400, detail="Recording analysis requires user consent confirmation.")

    # Max size: 25 MB
    contents = await file.read()
    if len(contents) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File exceeds maximum allowed size of 25MB.")
    if len(contents) < 512:
        raise HTTPException(status_code=400, detail="Audio file is empty or corrupted.")

    try:
        samples, sr = decode_audio_bytes(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Unsupported or unreadable audio format: {str(e)}")

    analysis_result = classify_voice_segment(samples, sr=sr)
    analysis_result["filename"] = file.filename
    analysis_result["file_size_bytes"] = len(contents)
    analysis_result["sample_rate"] = sr

    return analysis_result

@router.websocket("/ws/voice-analysis/{session_id}")
async def voice_analysis_websocket(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for live microphone or audio interface streaming.
    Receives raw audio chunks from frontend, runs voice authenticity inspection,
    and returns real-time classification metrics.
    """
    await websocket.accept()
    session = session_manager.get_session(session_id)
    if not session:
        # Create session if not yet initialized
        session = session_manager.create_session(
            mode="microphone",
            audio_source="laptop_microphone",
            user_consent=True
        )

    session_manager.register_websocket(session.session_id, websocket)
    session_manager.update_state(session.session_id, "streaming_audio")

    try:
        while True:
            # Receive either binary audio chunk or JSON message
            message = await websocket.receive()
            if "bytes" in message and message["bytes"]:
                raw_bytes = message["bytes"]
                # Decode float32 or int16 PCM
                try:
                    samples, sr = decode_audio_bytes(raw_bytes)
                except Exception:
                    # Treat as raw 16kHz 16-bit PCM mono
                    int_samples = np.frombuffer(raw_bytes, dtype=np.int16)
                    samples = int_samples.astype(np.float32) / 32768.0
                    sr = 16000

                result = classify_voice_segment(samples, sr=sr)
                await websocket.send_json(result)
            elif "text" in message and message["text"]:
                try:
                    data = json.loads(message["text"])
                    if data.get("action") == "stop":
                        session_manager.update_state(session.session_id, "stopped")
                        await websocket.send_json({"status": "stopped", "message": "Streaming stopped by user."})
                        break
                except json.JSONDecodeError:
                    pass
    except WebSocketDisconnect:
        session_manager.update_state(session.session_id, "stopped")
    finally:
        session_manager.unregister_websocket(session.session_id, websocket)

@router.websocket("/ws/telecom/media-stream")
async def twilio_media_stream_websocket(websocket: WebSocket):
    """Twilio Media Streams WebSocket handler."""
    await websocket.accept()
    stream_sid = None
    try:
        while True:
            text = await websocket.receive_text()
            data = json.loads(text)
            event = data.get("event")

            if event == "start":
                stream_sid = data.get("start", {}).get("streamSid")
                logger.info(f"Twilio Media Stream started: {stream_sid}")
            elif event == "media":
                payload = data.get("media", {}).get("payload")
                if payload:
                    result = telecom_service.process_media_packet(payload)
                    # Result can be broadcast to any listening client sessions
            elif event == "stop":
                logger.info(f"Twilio Media Stream ended: {stream_sid}")
                break
    except WebSocketDisconnect:
        logger.info("Twilio media stream disconnected")
