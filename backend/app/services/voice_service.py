"""
Voice analysis coordination service.
Bridges API endpoints to the AI inference detector and persists analysis records.
"""
import uuid
from typing import Dict, Any, Optional
import numpy as np

from AI.inference.detector import VoiceDeepfakeDetector
from backend.app.database import repository

# Singleton detector instance loaded once in memory
detector = VoiceDeepfakeDetector()

def analyze_audio_file(
    contents: bytes,
    filename: Optional[str] = None,
    session_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes deepfake voice inspection on uploaded audio file bytes,
    records results in the database, and returns the structured report.
    """
    analysis_id = f"ANL-{uuid.uuid4().hex[:10].upper()}"
    report = detector.analyze_bytes(contents)

    record = {
        "analysis_id": analysis_id,
        "session_id": session_id,
        "mode": "upload",
        "filename": filename,
        "file_size_bytes": len(contents),
        "sample_rate": 16000,
        "label": report["label"],
        "confidence": report["confidence"],
        "synthetic_probability": report["synthetic_probability"],
        "is_synthetic": report["is_synthetic"],
        "status": report["status"],
        "model_identifier": report["model_identifier"],
        "disclaimer": report["disclaimer"],
        "segments_count": report["segments_count"],
        "segments": report["segments"],
        "metrics": report["metrics"],
        "processing_time_ms": report["processing_time_ms"],
        "error_message": report.get("reason")
    }

    repository.save_analysis(record)
    return record

def analyze_streaming_chunk(
    samples: np.ndarray,
    sr: int = 16000,
    session_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes live acoustic inspection on streaming audio PCM chunk.
    Does not write every sub-second chunk to disk database to minimize latency.
    """
    report = detector.analyze_waveform(samples, sr=sr)
    report["session_id"] = session_id
    return report
