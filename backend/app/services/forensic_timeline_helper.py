"""
Forensic Timeline & Biomechanical Explainer Helper.
Generates 5-second interval trajectory, comparative metrics, and LLM reasoning.
"""
from typing import Dict, Any, List, Callable
import numpy as np

from AI.preprocessing.feature_extractor import extract_feature_vector
from AI.preprocessing.forensic_comparator import build_comparison_metrics
from AI.inference.llm_explainer import generate_risk_explanation

def build_timeline_5s_intervals(
    sanitized: np.ndarray,
    duration_sec: float,
    overall_prob: float,
    infer_fn: Callable[[np.ndarray], float]
) -> List[Dict[str, Any]]:
    """Slices recording into 5.0s sequential windows with acoustic metrics."""
    timeline_5s = []
    slice_samples = 16000 * 5
    total_len = len(sanitized)
    s_idx = 0
    i_idx = 0

    while s_idx < total_len:
        e_idx = min(s_idx + slice_samples, total_len)
        chunk = sanitized[s_idx:e_idx]
        s_sec = round(s_idx / 16000.0, 1)
        e_sec = round(e_idx / 16000.0, 1)
        if len(chunk) < 16000 * 0.35 and len(timeline_5s) > 0:
            break

        f_vec = extract_feature_vector(chunk, 16000)
        try:
            p_spoof = infer_fn(chunk)
            score = round(p_spoof * 100.0, 1)
        except Exception:
            score = round(overall_prob, 1)

        is_synth = score >= 50.0
        t_start_fmt = f"{int(s_sec // 60):02d}:{int(s_sec % 60):02d}"
        t_end_fmt = f"{int(e_sec // 60):02d}:{int(e_sec % 60):02d}"

        timeline_5s.append({
            "interval_index": i_idx,
            "time_range": f"{t_start_fmt} - {t_end_fmt}",
            "start_sec": s_sec,
            "end_sec": e_sec,
            "synthetic_probability": score,
            "human_probability": round(100.0 - score, 1),
            "label": "AI Voice Detected" if is_synth else "Likely Human",
            "is_synthetic": is_synth,
            "f0_hz": round(float(f_vec[0]), 1),
            "jitter_ppq": round(float(f_vec[1]), 3),
            "shimmer_apq": round(float(f_vec[2]), 3),
            "hnr_db": round(float(f_vec[3]), 1),
            "spectral_centroid": round(float(f_vec[4]), 1),
            "hf_ratio": round(float(f_vec[6]), 3)
        })
        i_idx += 1
        s_idx = e_idx

    return timeline_5s

def build_forensic_report_extensions(
    sanitized: np.ndarray,
    duration_sec: float,
    agg: Dict[str, Any],
    infer_fn: Callable[[np.ndarray], float]
) -> Dict[str, Any]:
    """Builds timeline_5s_intervals, comparison_metrics, and llm_risk_explanation."""
    full_vec = extract_feature_vector(sanitized, 16000)
    overall_prob = agg.get("overall_spoof_prob", 25.0)
    is_synth = bool(agg.get("final_risk_score", 25.0) >= 50.0)

    timeline_5s = build_timeline_5s_intervals(sanitized, duration_sec, overall_prob, infer_fn)

    metrics_dict = {
        "duration_seconds": duration_sec,
        "f0_mean_hz": round(float(full_vec[0]), 1),
        "jitter_ppq": round(float(full_vec[1]), 3),
        "shimmer_apq": round(float(full_vec[2]), 3),
        "hnr_db": round(float(full_vec[3]), 1),
        "spectral_centroid": round(float(full_vec[4]), 1),
        "spectral_rolloff": round(float(full_vec[5]), 1),
        "vocoder_signature": "Neural Vocoder Signature" if is_synth else "Natural Glottal Source",
        "vocoder_detected": is_synth
    }

    comp_metrics = build_comparison_metrics(metrics_dict, full_vec, is_synth)

    llm_payload = {
        "label": agg.get("final_threat_tier", "LOW"),
        "synthetic_probability": overall_prob,
        "metrics": metrics_dict,
        "timeline_5s_intervals": timeline_5s
    }
    llm_explanation = generate_risk_explanation(llm_payload)

    return {
        "timeline_5s_intervals": timeline_5s,
        "comparison_metrics": comp_metrics,
        "llm_risk_explanation": llm_explanation,
        "metrics": metrics_dict
    }

