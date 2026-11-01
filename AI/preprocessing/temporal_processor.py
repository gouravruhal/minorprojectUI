"""
Temporal audio dynamics processor tailored for 10 to 20-second recordings.
Aggregates windowed acoustic features into temporal variance and stability tensors.
"""
from typing import List, Dict, Any
import numpy as np
from AI.preprocessing.feature_extractor import extract_feature_vector

def extract_temporal_feature_vector(segment_features: List[np.ndarray]) -> np.ndarray:
    """
    Combines a sequence of segment feature vectors (from a 10-20s audio clip)
    into a unified temporal feature vector capturing mean and temporal variance.
    Input segment feature shape: (N_segments, 19)
    Output shape: (28,)
    """
    if not segment_features:
        return np.zeros(28, dtype=np.float32)

    feats = np.array(segment_features, dtype=np.float32)
    # Features per row: [0: f0, 1: jitter, 2: shimmer, 3: hnr, 4: centroid, 5: rolloff, 6: hf_ratio, 7-18: lfcc(12)]
    f0_mean = float(np.mean(feats[:, 0]))
    f0_std = float(np.std(feats[:, 0]))

    jitter_mean = float(np.mean(feats[:, 1]))
    jitter_std = float(np.std(feats[:, 1]))
    jitter_min = float(np.min(feats[:, 1]))

    shimmer_mean = float(np.mean(feats[:, 2]))
    shimmer_std = float(np.std(feats[:, 2]))

    hnr_mean = float(np.mean(feats[:, 3]))
    hnr_std = float(np.std(feats[:, 3]))

    centroid_mean = float(np.mean(feats[:, 4]))
    rolloff_mean = float(np.mean(feats[:, 5]))
    hf_ratio_mean = float(np.mean(feats[:, 6]))
    hf_ratio_std = float(np.std(feats[:, 6]))

    # Mean LFCCs across all windows in the 10-20s recording
    lfcc_means = np.mean(feats[:, 7:19], axis=0)

    # Spectral flux across adjacent time windows (temporal continuity)
    if len(feats) > 1:
        spectral_flux = float(np.mean(np.abs(np.diff(feats[:, 4]))))
    else:
        spectral_flux = 0.0

    temporal_stats = np.array([
        f0_mean, f0_std,
        jitter_mean, jitter_std, jitter_min,
        shimmer_mean, shimmer_std,
        hnr_mean, hnr_std,
        centroid_mean, rolloff_mean,
        hf_ratio_mean, hf_ratio_std,
        spectral_flux
    ], dtype=np.float32)

    return np.concatenate([temporal_stats, lfcc_means.astype(np.float32)])

def compute_temporal_summary(segments: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generates human-readable temporal metrics across the 10-20s timeline."""
    if not segments:
        return {}

    jitters = [s.get("jitter_ppq", 0.74) for s in segments]
    shimmers = [s.get("shimmer_apq", 2.15) for s in segments]
    hnrs = [s.get("hnr_db", 18.0) for s in segments]
    synth_probs = [s.get("synthetic_probability", 50.0) for s in segments]

    return {
        "total_windows_evaluated": len(segments),
        "mean_synthetic_risk": round(float(np.mean(synth_probs)), 1),
        "peak_synthetic_risk": round(float(np.max(synth_probs)), 1),
        "temporal_jitter_stability": round(float(np.std(jitters)), 3),
        "temporal_shimmer_stability": round(float(np.std(shimmers)), 3),
        "mean_hnr_db": round(float(np.mean(hnrs)), 1),
        "anomalous_segments_ratio": round(
            float(sum(1 for p in synth_probs if p >= 65.0) / len(synth_probs)), 2
        )
    }

