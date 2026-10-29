"""
Database repository functions for sessions and voice analyses.
"""
import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from backend.app.database.db import get_connection

def create_session(session_id: str, mode: str, audio_source: str, user_consent: bool, phone_number: Optional[str] = None) -> Dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO sessions (session_id, mode, audio_source, user_consent, phone_number, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (session_id, mode, audio_source, 1 if user_consent else 0, phone_number, "created", now, now)
        )
        conn.commit()
    return {
        "session_id": session_id, "mode": mode, "audio_source": audio_source,
        "user_consent": user_consent, "phone_number": phone_number,
        "status": "created", "created_at": now
    }

def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sessions WHERE session_id = ?", (session_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return dict(row)

def update_session_status(session_id: str, status: str) -> bool:
    now = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE sessions SET status = ?, updated_at = ? WHERE session_id = ?", (status, now, session_id))
        conn.commit()
        return cursor.rowcount > 0

def save_analysis(data: Dict[str, Any]) -> Dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    analysis_id = data["analysis_id"]
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO voice_analyses (
                analysis_id, session_id, mode, filename, file_size_bytes, sample_rate,
                duration_seconds, label, confidence, synthetic_probability, is_synthetic,
                status, model_identifier, metrics_json, segments_json, processing_time_ms,
                error_message, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                analysis_id, data.get("session_id"), data.get("mode", "upload"),
                data.get("filename"), data.get("file_size_bytes", 0), data.get("sample_rate", 16000),
                data.get("metrics", {}).get("duration_seconds", 0.0), data["label"],
                data["confidence"], data["synthetic_probability"], 1 if data["is_synthetic"] else 0,
                data.get("status", "success"), data.get("model_identifier", "voiceshield-acoustic-dsp-v1"),
                json.dumps(data.get("metrics", {})), json.dumps(data.get("segments", [])),
                data.get("processing_time_ms", 0.0), data.get("error_message"), now
            )
        )
        conn.commit()
    data["created_at"] = now
    return data

def get_analysis(analysis_id: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM voice_analyses WHERE analysis_id = ?", (analysis_id,))
        row = cursor.fetchone()
        if not row:
            return None
        item = dict(row)
        item["metrics"] = json.loads(item["metrics_json"])
        item["segments"] = json.loads(item["segments_json"])
        item["segments_count"] = len(item["segments"])
        item["disclaimer"] = (
            "Classification labels and confidence scores represent probabilistic acoustic forensic estimations. "
            "They do not constitute a definitive or legally binding guarantee of authenticity."
        )
        item["is_synthetic"] = bool(item["is_synthetic"])
        return item
