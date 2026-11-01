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
    packed_metrics = dict(data.get("metrics", {}))
    packed_metrics["_timeline_5s"] = data.get("timeline_5s_intervals", [])
    packed_metrics["_comparison_metrics"] = data.get("comparison_metrics", {})
    packed_metrics["_temporal_dynamics"] = data.get("temporal_dynamics", {})
    packed_metrics["_llm_risk_explanation"] = data.get("llm_risk_explanation", {})

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
                json.dumps(packed_metrics), json.dumps(data.get("segments", [])),
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
        metrics_raw = json.loads(item["metrics_json"])
        item["timeline_5s_intervals"] = metrics_raw.pop("_timeline_5s", [])
        item["comparison_metrics"] = metrics_raw.pop("_comparison_metrics", {})
        item["temporal_dynamics"] = metrics_raw.pop("_temporal_dynamics", {})
        item["llm_risk_explanation"] = metrics_raw.pop("_llm_risk_explanation", {})
        item["metrics"] = metrics_raw
        item["segments"] = json.loads(item["segments_json"])
        item["segments_count"] = len(item["segments"])
        item["disclaimer"] = (
            "Classification labels and confidence scores represent probabilistic acoustic forensic estimations. "
            "They do not constitute a definitive or legally binding guarantee of authenticity."
        )
        item["is_synthetic"] = bool(item["is_synthetic"])
        return item

def get_recent_analyses(limit: int = 15) -> list[Dict[str, Any]]:
    """Retrieves most recent voice analyses ordered by creation timestamp."""
    results = []
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM voice_analyses ORDER BY created_at DESC LIMIT ?", (limit,))
        for row in cursor.fetchall():
            item = dict(row)
            try:
                item["metrics"] = json.loads(item.get("metrics_json", "{}"))
                item["segments"] = json.loads(item.get("segments_json", "[]"))
            except Exception:
                item["metrics"], item["segments"] = {}, []
            item["is_synthetic"] = bool(item["is_synthetic"])
            results.append(item)
    return results

def save_context_analysis(data: Dict[str, Any]) -> Dict[str, Any]:
    """Persists structured conversational transcript, NLP threat scores, and LLM reasoning."""
    now = datetime.now(timezone.utc).isoformat()
    cid = data.get("context_id") or f"CTX-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    data["context_id"] = cid
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT OR REPLACE INTO context_analyses (
                context_id, analysis_id, filename, caller_name, network, duration_seconds,
                transcript, intent_category, keywords_json, linguistic_score, urgency_index,
                acoustic_risk, unified_risk_score, unified_threat_tier, recommended_action,
                llm_reasoning_summary, llm_model, metadata_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                cid, data.get("analysis_id"), data.get("filename", "audio_sample.wav"),
                data.get("caller_name", "Caller"), data.get("network", "Standard PSTN"),
                float(data.get("duration_seconds", 4.0)), data.get("transcript", ""),
                data.get("intent_category", "Benign Conversation"),
                json.dumps(data.get("keywords", [])), float(data.get("linguistic_score", 10.0)),
                float(data.get("urgency_index", 10.0)), float(data.get("acoustic_risk", 10.0)),
                float(data.get("unified_risk_score", 10.0)), data.get("unified_threat_tier", "LOW"),
                data.get("recommended_action", "CONTINUE_MONITORING"),
                data.get("llm_reasoning_summary", ""), data.get("llm_model", "ForensicLLMReasoner-v2"),
                json.dumps(data.get("metadata", {})), now
            )
        )
        conn.commit()
    data["created_at"] = now
    return data

def get_context_analysis(context_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves context analysis report and parsed entity list by ID."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM context_analyses WHERE context_id = ?", (context_id,))
        row = cursor.fetchone()
        if not row:
            return None
        item = dict(row)
        try:
            item["keywords"] = json.loads(item.get("keywords_json", "[]"))
            item["metadata"] = json.loads(item.get("metadata_json", "{}"))
        except Exception:
            item["keywords"], item["metadata"] = [], {}
        return item

def get_recent_context_analyses(limit: int = 15) -> list[Dict[str, Any]]:
    """Retrieves recent context analysis reports ordered by creation date."""
    results = []
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM context_analyses ORDER BY created_at DESC LIMIT ?", (limit,))
        for row in cursor.fetchall():
            item = dict(row)
            try:
                item["keywords"] = json.loads(item.get("keywords_json", "[]"))
                item["metadata"] = json.loads(item.get("metadata_json", "{}"))
            except Exception:
                item["keywords"], item["metadata"] = [], {}
            results.append(item)
    return results
