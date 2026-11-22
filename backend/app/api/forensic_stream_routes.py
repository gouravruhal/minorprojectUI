"""
FastAPI REST and WebSocket Streaming Routes for Real-Time Call Forensics.
Exposes POST /api/v1/analyze-audio, WebSocket /ws/live-call/{call_id},
and sample call streaming audio endpoints for simulated live call playback.
"""
import os, json
from typing import Optional
import numpy as np
from fastapi import APIRouter, UploadFile, File, Form, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import Response

from backend.app.services.forensic_stream_service import forensic_stream_service
from AI.preprocessing.audio_normalizer import decode_audio_bytes

router = APIRouter(tags=["Forensic Call Telemetry"])
DOWNLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "downloads")

@router.get("/api/v1/sample-calls")
async def list_sample_calls():
    """Dynamically queries verified call audio samples available on disk for live simulation."""
    import soundfile as sf
    samples = []
    if os.path.exists(DOWNLOADS_DIR):
        for f in sorted(os.listdir(DOWNLOADS_DIR)):
            if f.endswith(".wav"):
                p = os.path.join(DOWNLOADS_DIR, f)
                try:
                    info = sf.info(p)
                    dur = round(info.duration, 1)
                except Exception:
                    dur = 2.5
                is_ai = "ai" in f.lower() or "synth" in f.lower()
                clean_name = f.replace(".wav", "").replace("_", " ").title()
                title = f"{'AI Clone Attack' if is_ai else 'Executive Caller'} — {clean_name}"
                samples.append({
                    "id": f,
                    "title": title,
                    "type": "synthetic" if is_ai else "bona_fide",
                    "duration_sec": dur
                })
    return samples

@router.get("/api/v1/sample-calls/{sample_name}/audio")
async def get_sample_call_audio(sample_name: str):
    """Streams sample audio file bytes in-memory for simulated live playback."""
    path = os.path.join(DOWNLOADS_DIR, sample_name)
    if not os.path.exists(path) or not sample_name.endswith((".wav", ".mp3", ".m4a")):
        raise HTTPException(status_code=404, detail="Sample call audio not found.")
    with open(path, "rb") as f:
        data = f.read()
    return Response(content=data, media_type="audio/wav")

@router.post("/api/v1/analyze-audio")
async def analyze_audio_endpoint(
    file: UploadFile = File(...),
    transaction_sensitivity: str = Form("medium"),
    caller_trust_level: str = Form("standard"),
    unusual_location_or_voip_flag: bool = Form(False),
    route_type: str = Form("cellular"),
    transaction_amount: float = Form(0.0),
    known_contact: bool = Form(True),
    claimed_identity: Optional[str] = Form(None),
    caller_id: Optional[str] = Form(None)
):
    contents = await file.read()
    if len(contents) < 512:
        raise HTTPException(status_code=400, detail="Audio file empty or corrupted.")

    context = {
        "transaction_sensitivity": transaction_sensitivity,
        "caller_trust_level": caller_trust_level,
        "unusual_location_or_voip_flag": unusual_location_or_voip_flag,
        "route_type": route_type,
        "transaction_amount": transaction_amount,
        "known_contact": known_contact,
        "claimed_identity": claimed_identity,
        "claimed_vip": claimed_identity,
        "caller_id": caller_id
    }

    try:
        return forensic_stream_service.analyze_full_call(
            contents=contents, filename=file.filename, context=context
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failure: {str(e)}")

@router.websocket("/ws/live-call/{call_id}")
async def live_call_websocket(websocket: WebSocket, call_id: str):
    """Low-latency WebSocket streaming endpoint for ongoing call monitoring."""
    await websocket.accept()
    session = forensic_stream_service.get_or_create_call_session(call_id)

    try:
        while True:
            msg = await websocket.receive()
            if "bytes" in msg and msg["bytes"]:
                raw_bytes = msg["bytes"]
                try:
                    samples, sr = decode_audio_bytes(raw_bytes)
                except Exception:
                    int_samples = np.frombuffer(raw_bytes, dtype=np.int16)
                    samples = int_samples.astype(np.float32) / 32768.0
                    sr = 16000

                frame = forensic_stream_service.process_stream_chunk(call_id, samples, sr=sr)
                if frame is not None:
                    await websocket.send_json(frame)
                    if frame.get("threat_tier") == "CRITICAL" or frame.get("voice_swap"):
                        await websocket.send_json({
                            "event": "SECURITY_ALERT",
                            "call_id": call_id,
                            "tier": "CRITICAL",
                            "recommendation": frame.get("action", "FREEZE_TRANSACTION"),
                            "reason": "Mid-call voice swap, VIP impersonation mismatch, or high synthetic probability."
                        })

            elif "text" in msg and msg["text"]:
                try:
                    payload = json.loads(msg["text"])
                    if payload.get("action") == "configure":
                        forensic_stream_service.get_or_create_call_session(
                            call_id, context=payload.get("context")
                        )
                        await websocket.send_json({"status": "CONFIGURED", "call_id": call_id})
                    elif payload.get("action") == "stop":
                        await websocket.send_json({"event": "SESSION_STOPPED", "call_id": call_id})
                        break
                except Exception:
                    pass

    except WebSocketDisconnect:
        pass
    finally:
        forensic_stream_service.close_call_session(call_id)
