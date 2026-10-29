"""
Modular AI Voice Detection Engine.
Combines acoustic glottal perturbation analysis, spectral feature manifolds,
and neural vocoder detection to classify audio as:
- Likely Human Speech
- Potentially AI-Generated Speech
- Inconclusive
"""
import time
from typing import Dict, Any
import numpy as np
from backend.audio_dsp import (
    compute_rms,
    extract_pitch_f0,
    compute_jitter_ppq5,
    compute_shimmer_apq3,
    compute_spectral_features,
    detect_vocoder_artifacts
)

MODEL_IDENTIFIER = "voiceshield-acoustic-dsp-v1"
DISCLAIMER_TEXT = (
    "Classification labels and confidence scores represent probabilistic acoustic forensic estimations. "
    "They do not constitute a definitive or legally binding guarantee of authenticity."
)

def classify_voice_segment(samples: np.ndarray, sr: int = 16000) -> Dict[str, Any]:
    """
    Perform modular voice authenticity analysis on an audio segment.
    Returns structured results conforming to forensic detection requirements.
    """
    start_time = time.perf_counter()
    duration_sec = len(samples) / float(sr) if sr > 0 else 0.0

    # Minimum audio requirement: at least 400ms for reliable pitch & glottal analysis
    if duration_sec < 0.40:
        return {
            "label": "Inconclusive",
            "confidence": 0.50,
            "synthetic_probability": 50.0,
            "is_synthetic": False,
            "status": "inconclusive",
            "reason": "Audio segment too brief for acoustic verification (minimum 400ms required).",
            "processing_time_ms": round((time.perf_counter() - start_time) * 1000, 2),
            "model_identifier": MODEL_IDENTIFIER,
            "disclaimer": DISCLAIMER_TEXT,
            "metrics": {
                "duration_seconds": round(duration_sec, 2),
                "rms_energy": 0.0,
                "jitter_ppq": 0.0,
                "shimmer_apq": 0.0,
                "hnr_db": 0.0,
                "spectral_centroid": 0.0,
                "vocoder_signature": "None (Insufficient Audio)"
            }
        }

    rms = compute_rms(samples)
    if rms < 0.008:
        # Near silence or background room noise without voice
        return {
            "label": "Inconclusive",
            "confidence": 0.50,
            "synthetic_probability": 50.0,
            "is_synthetic": False,
            "status": "inconclusive",
            "reason": "Input audio energy is below voice activity threshold (silence/noise).",
            "processing_time_ms": round((time.perf_counter() - start_time) * 1000, 2),
            "model_identifier": MODEL_IDENTIFIER,
            "disclaimer": DISCLAIMER_TEXT,
            "metrics": {
                "duration_seconds": round(duration_sec, 2),
                "rms_energy": round(float(rms), 4),
                "jitter_ppq": 0.0,
                "shimmer_apq": 0.0,
                "hnr_db": 0.0,
                "spectral_centroid": 0.0,
                "vocoder_signature": "None (Silence)"
            }
        }

    # Extract acoustic metrics
    f0_mean, f0_series = extract_pitch_f0(samples, sr)
    jitter = compute_jitter_ppq5(f0_series)
    shimmer = compute_shimmer_apq3(samples, sr)
    spectral = compute_spectral_features(samples, sr)
    vocoder = detect_vocoder_artifacts(samples, sr, jitter, shimmer)

    # Forensic scoring algorithm based on physiological biological vocal fold dynamics
    synthetic_score = 0.0

    # 1. Glottal Jitter check (human baseline: 0.5% - 2.0%)
    if jitter < 0.25:
        synthetic_score += 35.0  # unnatural robotic stability
    elif jitter < 0.40:
        synthetic_score += 20.0
    elif jitter > 4.5:
        synthetic_score += 15.0  # unnatural vocoder phase drift

    # 2. Glottal Shimmer check (human baseline: 1.5% - 4.5%)
    if shimmer < 0.8:
        synthetic_score += 30.0  # overly smooth amplitude envelope
    elif shimmer < 1.2:
        synthetic_score += 15.0

    # 3. Spectral Centroid & Vocoder phase continuity
    if vocoder["vocoder_detected"]:
        synthetic_score += 25.0

    # 4. Harmonicity (HNR)
    if spectral["hnr_db"] > 28.0:
        synthetic_score += 10.0  # synthetic voices often have artificially high harmonic purity

    synthetic_prob = float(np.clip(synthetic_score, 4.0, 96.0))

    # Cautious categorization
    if synthetic_prob >= 65.0:
        label = "Potentially AI-Generated Speech"
        confidence = round(synthetic_prob / 100.0, 2)
        is_synthetic = True
    elif synthetic_prob <= 35.0:
        label = "Likely Human Speech"
        confidence = round((100.0 - synthetic_prob) / 100.0, 2)
        is_synthetic = False
    else:
        label = "Inconclusive"
        confidence = 0.55
        is_synthetic = False

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    return {
        "label": label,
        "confidence": confidence,
        "synthetic_probability": round(synthetic_prob, 1),
        "is_synthetic": is_synthetic,
        "status": "success",
        "processing_time_ms": elapsed_ms,
        "model_identifier": MODEL_IDENTIFIER,
        "disclaimer": DISCLAIMER_TEXT,
        "metrics": {
            "duration_seconds": round(duration_sec, 2),
            "rms_energy": round(float(rms), 4),
            "f0_mean_hz": round(f0_mean, 1),
            "jitter_ppq": jitter,
            "shimmer_apq": shimmer,
            "hnr_db": spectral["hnr_db"],
            "spectral_centroid": spectral["spectral_centroid"],
            "spectral_rolloff": spectral["rolloff"],
            "vocoder_signature": vocoder["vocoder_signature"],
            "vocoder_detected": vocoder["vocoder_detected"]
        }
    }
