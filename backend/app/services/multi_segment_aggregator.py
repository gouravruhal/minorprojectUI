"""
Multi-Segment Forensic Aggregator for Long-Form Audio Calls.
Enforces Hybrid Peak-Mean risk formulation and voice-swap security escalation.
Aligned with synopsis thresholds: 0-39 (Safe), 40-69 (Warn), 70+ (Critical).
"""
from typing import List, Dict, Any, Tuple, Optional
import numpy as np

def compute_hybrid_risk_score(
    segment_risks: List[float],
    any_voice_swap: bool = False,
    sensitivity: str = "medium"
) -> Tuple[float, str, str]:
    """Computes hybrid peak-mean risk score across sequential 4.0s segments."""
    if not segment_risks:
        return 50.0, "WARN", "REQUEST_CALLBACK"

    max_risk = float(np.max(segment_risks))
    sorted_desc = sorted(segment_risks, reverse=True)
    top_k = sorted_desc[:min(3, len(sorted_desc))]
    top_k_mean = float(np.mean(top_k))
    mean_risk = float(np.mean(segment_risks))

    final_risk = 0.55 * max_risk + 0.30 * top_k_mean + 0.15 * mean_risk

    if any_voice_swap or max_risk >= 70.0 or final_risk >= 70.0:
        final_risk = max(final_risk, 80.0 if any_voice_swap else final_risk)
        threat_tier = "CRITICAL"
        action = "FREEZE_TRANSACTION"
    elif final_risk >= 40.0:
        threat_tier = "WARN"
        action = "REQUEST_CALLBACK"
    else:
        threat_tier = "SAFE"
        action = "CONTINUE_MONITORING"

    return round(float(final_risk), 1), threat_tier, action

def aggregate_segments(
    segments: List[Dict[str, Any]],
    speaker_summary: Dict[str, Any],
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Combines block-by-block telemetry into an enterprise forensic call verdict."""
    if not segments:
        return {"final_risk_score": 50.0, "final_threat_tier": "WARN", "segments": []}

    segment_risks = [float(s["risk_score"]) for s in segments]
    any_swap = (
        any(bool(s.get("voice_swap_detected")) for s in segments) or
        bool(speaker_summary.get("voice_swap_detected")) or
        bool(speaker_summary.get("impersonation_detected"))
    )

    ctx = context or {}
    sens = str(ctx.get("transaction_sensitivity", "medium")).lower()
    final_risk, threat_tier, action = compute_hybrid_risk_score(segment_risks, any_voice_swap=any_swap, sensitivity=sens)

    peak_idx = int(np.argmax(segment_risks))
    peak_segment = segments[peak_idx]

    spoof_probs = [float(s["spoof_prob"]) for s in segments]
    overall_p_spoof = round(0.60 * max(spoof_probs) + 0.40 * float(np.mean(spoof_probs)), 1)

    spec_list = [s.get("attributions", {}).get("spectral_anomaly", 5.0) for s in segments]
    phase_list = [s.get("attributions", {}).get("phase_discontinuity", 5.0) for s in segments]
    pros_list = [s.get("attributions", {}).get("prosodic_unnaturalness", 5.0) for s in segments]

    spectral_avg = round(float(np.mean(spec_list)), 1) if spec_list else 5.0
    phase_avg = round(float(np.mean(phase_list)), 1) if phase_list else 5.0
    prosodic_avg = round(float(np.mean(pros_list)), 1) if pros_list else 5.0

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
