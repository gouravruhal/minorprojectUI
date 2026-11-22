"""
FastAPI REST and WebSocket Streaming Routes for Real-Time Call Forensics.
Exposes POST /api/v1/analyze-audio and WebSocket /ws/live-call/{call_id}.
Zero-disk in-memory audio processing and context-aware metadata support.
"""
import json
from typing import Optional
import numpy as np
from fastapi import APIRouter, UploadFile, File, Form, WebSocket, WebSocketDisconnect, HTTPException

from backend.app.services.forensic_stream_service import forensic_stream_service
from AI.preprocessing.audio_normalizer import decode_audio_bytes

router = APIRouter(tags=["Forensic Call Telemetry"])

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
    """
    Ingests call recording in-memory (zero disk writes), extracts multi-view forensic features,
    runs deep learning inference, and calculates 4-factor context-aware impersonation risk.
    """
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
        report = forensic_stream_service.analyze_full_call(
            contents=contents,
            filename=file.filename,
            context=context
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failure: {str(e)}")

@router.websocket("/ws/live-call/{call_id}")
async def live_call_websocket(websocket: WebSocket, call_id: str):
    """
    Low-latency WebSocket streaming endpoint for ongoing call monitoring.
    Accepts 16kHz PCM chunks and emits real-time risk frames and security alerts.
    """
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
                        break
                except Exception:
                    pass

    except WebSocketDisconnect:
        pass
    finally:
        forensic_stream_service.close_call_session(call_id)
