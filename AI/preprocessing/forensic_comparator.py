"""
Forensic comparator module for VoiceShield AI.
Computes 5-second timeline intervals and comparative biometric markers.
"""
from typing import List, Dict, Any
import numpy as np
from AI.preprocessing.feature_extractor import extract_feature_vector
from AI.configs.inference_config import SYNTHETIC_THRESHOLD, HUMAN_THRESHOLD

def compute_5s_intervals(
    samples: np.ndarray,
    sr: int,
    predict_fn,
    interval_sec: float = 5.0
) -> List[Dict[str, Any]]:
    """Slices audio into 5-second intervals and extracts acoustic forensic scores."""
    total_len = len(samples)
    interval_samples = int(sr * interval_sec)
    intervals = []
    start_idx = 0
    idx = 0

    while start_idx < total_len:
        end_idx = min(start_idx + interval_samples, total_len)
        chunk = samples[start_idx:end_idx]
        start_sec = round(float(start_idx) / float(sr), 2)
        end_sec = round(float(end_idx) / float(sr), 2)

        if len(chunk) < int(sr * 0.40):
            break

        f_vec = extract_feature_vector(chunk, sr)
        prob = round(predict_fn(f_vec), 1)
        is_synth = prob >= SYNTHETIC_THRESHOLD
        label = "AI Voice Detected" if is_synth else ("Likely Human" if prob <= HUMAN_THRESHOLD else "Inconclusive")

        t_start_fmt = f"{int(start_sec // 60):02d}:{int(start_sec % 60):02d}"
        t_end_fmt = f"{int(end_sec // 60):02d}:{int(end_sec % 60):02d}"

        intervals.append({
            "interval_index": idx,
            "time_range": f"{t_start_fmt} - {t_end_fmt}",
            "start_sec": start_sec,
            "end_sec": end_sec,
            "synthetic_probability": prob,
            "human_probability": round(100.0 - prob, 1),
            "label": label,
            "is_synthetic": is_synth,
            "f0_hz": round(float(f_vec[0]), 1),
            "jitter_ppq": round(float(f_vec[1]), 3),
            "shimmer_apq": round(float(f_vec[2]), 3),
            "hnr_db": round(float(f_vec[3]), 1),
            "spectral_centroid": round(float(f_vec[4]), 1),
            "hf_ratio": round(float(f_vec[6]), 3)
        })
        idx += 1
        start_idx = end_idx

    return intervals

def build_comparison_metrics(metrics: Dict[str, Any], full_vec: np.ndarray, is_synth: bool) -> Dict[str, Any]:
    """Builds comparative baseline matrices comparing detected speech against human and AI norms."""
    jitter = metrics.get("jitter_ppq", 0.74)
    shimmer = metrics.get("shimmer_apq", 2.15)
    hnr = metrics.get("hnr_db", 18.0)

    return {
        "jitter": {
            "name": "Glottal Jitter (PPQ5)",
            "detected": jitter,
            "human_norm": "0.50% - 2.00%",
            "ai_norm": "< 0.25%",
            "unit": "%",
            "is_anomaly": jitter < 0.30 or jitter > 3.0,
            "explanation": "Human vocal folds exhibit natural physical tremor; neural vocoders are over-smoothed."
        },
        "shimmer": {
            "name": "Glottal Shimmer (APQ3)",
            "detected": shimmer,
            "human_norm": "1.50% - 4.50%",
            "ai_norm": "< 1.00%",
            "unit": "%",
            "is_anomaly": shimmer < 1.00 or shimmer > 5.5,
            "explanation": "Cycle-to-cycle amplitude perturbation reveals biological tissue elasticity."
        },
        "hnr": {
            "name": "Harmonics-to-Noise Ratio (HNR)",
            "detected": hnr,
            "human_norm": "12.0 - 20.0 dB",
            "ai_norm": "> 22.0 dB",
            "unit": "dB",
            "is_anomaly": hnr > 21.5,
            "explanation": "High values indicate synthetic spectral denoising and synthetic phase cohesion."
        },
        "spectral_centroid": {
            "name": "Spectral Centroid",
            "detected": round(float(full_vec[4]), 1),
            "human_norm": "1200 - 2800 Hz",
            "ai_norm": "Unnatural shift",
            "unit": "Hz",
            "is_anomaly": is_synth,
            "explanation": "Indicates high-frequency energy distribution and transposed-convolution artifacts."
        }
    }

