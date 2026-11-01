"""
Multi-Segment Forensic Aggregator for Long-Form Audio Calls.
Enforces Hybrid Peak-Mean risk formulation and voice-swap security escalation.
"""
from typing import List, Dict, Any, Tuple, Optional
import numpy as np

def compute_hybrid_risk_score(
    segment_risks: List[float],
    any_voice_swap: bool = False,
    sensitivity: str = "medium"
) -> Tuple[float, str, str]:
    """
    Computes hybrid peak-mean risk score across sequential 4.0s segments:
    Final = 0.55 * max + 0.30 * top_3_mean + 0.15 * mean.
    Escalates to CRITICAL (>= 85.0) if voice swap or acute attack is detected.
    """
    if not segment_risks:
        return 50.0, "INCONCLUSIVE", "CONTINUE_MONITORING"

    max_risk = float(np.max(segment_risks))
    sorted_desc = sorted(segment_risks, reverse=True)
    top_k = sorted_desc[:min(3, len(sorted_desc))]
    top_k_mean = float(np.mean(top_k))
    mean_risk = float(np.mean(segment_risks))

    final_risk = 0.55 * max_risk + 0.30 * top_k_mean + 0.15 * mean_risk

    # Acute voice-swap or peak spoof escalation
    if any_voice_swap or max_risk >= 85.0 or final_risk >= 75.0:
        final_risk = max(final_risk, 85.0 if (any_voice_swap or max_risk >= 85.0) else final_risk)
        threat_tier = "CRITICAL"
        action = "TERMINATE_TRANSACTION" if sensitivity in ("high", "critical") else "INITIATE_MANUAL_CALLBACK"
    elif final_risk >= 55.0:
        threat_tier = "ELEVATED"
        action = "TRIGGER_MFA_CHALLENGE"
    elif final_risk >= 30.0:
        threat_tier = "GUARDED"
        action = "REQUEST_AUTHENTICATION"
    else:
        threat_tier = "LOW"
        action = "CONTINUE_MONITORING"

    return round(float(final_risk), 1), threat_tier, action

def aggregate_segments(
    segments: List[Dict[str, Any]],
    speaker_summary: Dict[str, Any],
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Combines block-by-block telemetry into an enterprise forensic call verdict."""
    if not segments:
        return {"final_risk_score": 50.0, "final_threat_tier": "INCONCLUSIVE", "segments": []}

    segment_risks = [float(s["risk_score"]) for s in segments]
    any_swap = (
        any(bool(s.get("voice_swap_detected")) for s in segments) or
        bool(speaker_summary.get("voice_swap_detected"))
    )

    ctx = context or {}
    sens = str(ctx.get("transaction_sensitivity", "medium")).lower()
    final_risk, threat_tier, action = compute_hybrid_risk_score(segment_risks, any_voice_swap=any_swap, sensitivity=sens)

    peak_idx = int(np.argmax(segment_risks))
    peak_segment = segments[peak_idx]

    spoof_probs = [float(s["spoof_prob"]) for s in segments]
    overall_p_spoof = round(0.60 * max(spoof_probs) + 0.40 * float(np.mean(spoof_probs)), 1)

    spectral_avg = round(float(np.mean([s["attributions"]["spectral_anomaly"] for s in segments])), 1)
    phase_avg = round(float(np.mean([s["attributions"]["phase_discontinuity"] for s in segments])), 1)
    prosodic_avg = round(float(np.mean([s["attributions"]["prosodic_unnaturalness"] for s in segments])), 1)

    return {
        "final_risk_score": final_risk,
        "final_threat_tier": threat_tier,
        "action_recommendation": action,
        "overall_spoof_prob": overall_p_spoof,
        "peak_segment": peak_segment,
        "segments": segments,
        "speaker_biometrics": speaker_summary,
        "attributions": {
            "spectral_anomaly": spectral_avg,
            "phase_discontinuity": phase_avg,
            "prosodic_unnaturalness": prosodic_avg
        }
    }
