"""
Prosodic, Micro-Modulation, and Glottal Feature Extractor.
Analyzes pitch contour dynamics (F0), Voiced/Unvoiced ratios, Jitter PPQ5,
Shimmer APQ3, HNR, and pause/rhythm metrics to detect synthetic prosodic smoothing.
"""
from typing import Dict, Any, Tuple, List
import numpy as np
from scipy.fft import rfft, rfftfreq

def track_f0_contour(
    waveform: np.ndarray,
    sr: int = 16000,
    frame_ms: float = 30.0,
    hop_ms: float = 10.0
) -> Tuple[np.ndarray, np.ndarray]:
    """Tracks frame-level F0 contour and binary voiced/unvoiced mask."""
    frame_len = int(sr * (frame_ms / 1000.0))  # 480
    hop_len = int(sr * (hop_ms / 1000.0))      # 160
    min_lag = int(sr / 450.0)                  # ~35
    max_lag = int(sr / 65.0)                   # ~246

    f0_list = []
    voiced_list = []

    for start in range(0, len(waveform) - frame_len + 1, hop_len):
        chunk = waveform[start:start + frame_len]
        energy = np.mean(chunk ** 2)
        if energy < 0.0001:
            f0_list.append(0.0)
            voiced_list.append(False)
            continue

        windowed = (chunk - np.mean(chunk)) * np.hanning(frame_len)
        corr = np.correlate(windowed, windowed, mode="full")[frame_len - 1:]
        search = corr[min_lag:max_lag]
        if len(search) == 0 or corr[0] <= 0:
            f0_list.append(0.0)
            voiced_list.append(False)
            continue

        peak_idx = int(np.argmax(search)) + min_lag
        # Parabolic interpolation for sub-sample lag refinement
        if 0 < peak_idx < len(corr) - 1:
            alpha, beta, gamma = corr[peak_idx - 1], corr[peak_idx], corr[peak_idx + 1]
            delta = (alpha - gamma) / (2.0 * (alpha - 2.0 * beta + gamma) + 1e-9)
            refined_lag = peak_idx + float(np.clip(delta, -0.5, 0.5))
        else:
            refined_lag = float(peak_idx)

        voicing_strength = corr[peak_idx] / (corr[0] + 1e-9)
        if voicing_strength > 0.10 and refined_lag > 0:
            f0 = sr / refined_lag
            if 65.0 <= f0 <= 450.0:
                f0_list.append(f0)
                voiced_list.append(True)
                continue

        f0_list.append(0.0)
        voiced_list.append(False)

    return np.array(f0_list, dtype=np.float32), np.array(voiced_list, dtype=bool)

def compute_jitter_ppq(f0_voiced: List[float]) -> float:
    """Computes Glottal Jitter PPQ5 (5-period perturbation quotient)."""
    if len(f0_voiced) < 5:
        return 0.15
    periods = [1.0 / f for f in f0_voiced if f > 0]
    n = len(periods)
    if n < 5:
        return 0.15
    diffs = [abs(periods[i] - np.mean(periods[i - 2:i + 3])) for i in range(2, n - 2)]
    mean_p = float(np.mean(periods))
    return round(float((np.mean(diffs) / (mean_p + 1e-9)) * 100.0), 3)

def compute_shimmer_apq(waveform: np.ndarray, sr: int = 16000) -> float:
    """Computes Glottal Shimmer APQ3 (3-point amplitude perturbation quotient)."""
    frame_len = int(sr * 0.025)
    hop_len = int(sr * 0.010)
    amps = [
        float(np.max(np.abs(waveform[i:i + frame_len])))
        for i in range(0, len(waveform) - frame_len + 1, hop_len)
        if np.max(np.abs(waveform[i:i + frame_len])) > 0.005
    ]
    if len(amps) < 3:
        return 0.65
    n = len(amps)
    diffs = [abs(amps[i] - np.mean(amps[i - 1:i + 2])) for i in range(1, n - 1)]
    mean_a = float(np.mean(amps))
    return round(float((np.mean(diffs) / (mean_a + 1e-9)) * 100.0), 3)

def compute_hnr_db(waveform: np.ndarray, sr: int = 16000) -> float:
    """Computes Harmonic-to-Noise Ratio (HNR) in decibels."""
    frame_len = int(sr * 0.030)
    if len(waveform) < frame_len:
        return 16.0
    frame = waveform[:frame_len] * np.hanning(frame_len)
    corr = np.correlate(frame, frame, mode="full")[frame_len - 1:]
    search = corr[int(sr / 450.0):int(sr / 65.0)]
    if len(search) == 0 or corr[0] <= 0:
        return 16.0
    peak = float(np.max(search))
    noise_energy = float(corr[0] - peak)
    ratio = peak / (noise_energy + 1e-9)
    if ratio <= 0:
        return 16.0
    return round(float(np.clip(10.0 * np.log10(ratio), 4.0, 36.0)), 1)

def compute_pause_rhythm_metrics(voiced_flags: np.ndarray, hop_ms: float = 10.0) -> Dict[str, float]:
    """Computes pause ratio, pause count, and mean pause duration."""
    total_frames = len(voiced_flags)
    if total_frames == 0:
        return {"pause_ratio": 0.0, "pause_count": 0.0, "mean_pause_ms": 0.0}

    pause_ratio = float(np.mean(~voiced_flags))
    # Count consecutive unvoiced runs >= 50ms (5 frames)
    runs = []
    current_run = 0
    for is_v in voiced_flags:
        if not is_v:
            current_run += 1
        else:
            if current_run >= 5:
                runs.append(current_run * hop_ms)
            current_run = 0
    if current_run >= 5:
        runs.append(current_run * hop_ms)

    pause_count = len(runs)
    mean_pause = float(np.mean(runs)) if runs else 0.0
    return {
        "pause_ratio": round(pause_ratio, 3),
        "pause_count": float(pause_count),
        "mean_pause_ms": round(mean_pause, 1)
    }

def extract_prosodic_profile(waveform: np.ndarray, sr: int = 16000) -> Dict[str, float]:
    """Extracts scalar prosodic, micro-perturbation, and rhythm metrics."""
    f0_contour, voiced_mask = track_f0_contour(waveform, sr)
    voiced_f0 = f0_contour[voiced_mask].tolist()

    f0_mean = float(np.mean(voiced_f0)) if voiced_f0 else 135.0
    f0_std = float(np.std(voiced_f0)) if voiced_f0 else 0.0
    f0_stability = float(f0_std / (f0_mean + 1e-9))
    vu_ratio = float(np.mean(voiced_mask)) if len(voiced_mask) > 0 else 0.0

    jitter = compute_jitter_ppq(voiced_f0)
    shimmer = compute_shimmer_apq(waveform, sr)
    hnr = compute_hnr_db(waveform, sr)
    pause_metrics = compute_pause_rhythm_metrics(voiced_mask)

    # Basic spectral moments
    windowed = waveform * np.hanning(len(waveform))
    mags = np.abs(rfft(windowed))
    freqs = rfftfreq(len(waveform), 1.0 / sr)
    total_e = float(np.sum(mags) + 1e-9)
    centroid = float(np.sum(freqs * mags) / total_e)
    rolloff = float(freqs[min(np.searchsorted(np.cumsum(mags), 0.85 * total_e), len(freqs) - 1)])

    return {
        "f0_mean": round(f0_mean, 1),
        "f0_std": round(f0_std, 1),
        "f0_stability": round(f0_stability, 3),
        "vu_ratio": round(vu_ratio, 3),
        "jitter_ppq": jitter,
        "shimmer_apq": shimmer,
        "hnr_db": hnr,
        "spectral_centroid": round(centroid, 1),
        "spectral_rolloff": round(rolloff, 1),
        **pause_metrics
    }

