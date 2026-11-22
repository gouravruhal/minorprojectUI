"""
Forensic Report Builder and DB Persistence Helper.
Constructs multi-modal forensic analysis reports incorporating acoustic,
biometric, and audio-language LLM intent telemetry.
"""
from typing import Dict, Any, List, Optional
from backend.app.database import repository

def build_and_save_report(
    analysis_id: str,
    filename: str,
    duration_sec: float,
    latency_ms: float,
    agg: Dict[str, Any],
    segments: List[Dict[str, Any]],
    speaker_summary: Dict[str, Any],
    ext: Dict[str, Any],
    context: Optional[Dict[str, Any]],
    speech_intent: Dict[str, Any]
) -> Dict[str, Any]:
    """Assembles and persists complete forensic report."""
    final_risk = agg["final_risk_score"]
    # Escalate if speech intent exhibits high social engineering threat
    if speech_intent.get("semantic_threat_score", 0) >= 60.0 or speech_intent.get("impersonation_claim_detected"):
        final_risk = max(final_risk, speech_intent.get("semantic_threat_score", 75.0))
        tier = "CRITICAL" if final_risk >= 70.0 else "WARN"
        action = "FREEZE_TRANSACTION" if final_risk >= 70.0 else "REQUEST_CALLBACK"
    else:
        tier = agg["final_threat_tier"]
        action = agg["action_recommendation"]

    report = {
        "analysis_id": analysis_id,
        "filename": filename or "call_audio.wav",
        "duration_sec": duration_sec,
        "status": "COMPLETED",
        "latency_ms": latency_ms,
        "final_risk_score": final_risk,
        "risk_score": final_risk,
        "final_threat_tier": tier,
        "threat_tier": tier,
        "is_synthetic": bool(final_risk >= 50.0),
        "action_recommendation": action,
        "analysis_mode": (context or {}).get("model_mode", "dual_fusion"),
        "voice_detection_risk": agg.get("voice_detection_risk", final_risk),
        "context_detection_risk": agg.get("context_detection_risk", speech_intent.get("semantic_threat_score", 15.0)),
        "overall_spoof_prob": agg["overall_spoof_prob"],
        "spoof_probability": agg["overall_spoof_prob"],
        "segments_count": len(segments),
        "segments": segments,
        "speaker_verification": speaker_summary,
        "attributions": agg["attributions"],
        "context_applied": context or {},
        "risk_breakdown": segments[-1]["risk_score"] if segments else {},
        "multi_layer_analysis": segments[-1]["dsp_features"] if segments else {},
        "speech_text_analysis": speech_intent,
        "timeline_5s_intervals": ext["timeline_5s_intervals"],
        "comparison_metrics": ext["comparison_metrics"],
        "llm_risk_explanation": ext["llm_risk_explanation"],
        "metrics": ext["metrics"]
    }

    try:
        repository.save_analysis({
            "analysis_id": analysis_id,
            "session_id": (context or {}).get("call_id"),
            "mode": "telecom_rest",
            "filename": filename,
            "label": tier,
            "confidence": round(agg["overall_spoof_prob"] / 100.0, 2),
            "synthetic_probability": agg["overall_spoof_prob"],
            "is_synthetic": bool(final_risk >= 50.0),
            "status": "success",
            "processing_time_ms": latency_ms,
            "model_identifier": "voiceshield-deep-fusion-v2",
            "disclaimer": "Forensic estimation.",
            "segments_count": len(segments),
            "segments": segments,
            "timeline_5s_intervals": ext["timeline_5s_intervals"],
            "comparison_metrics": ext["comparison_metrics"],
            "llm_risk_explanation": ext["llm_risk_explanation"],
            "metrics": ext["metrics"]
        })
    except Exception:
        pass

    return report
