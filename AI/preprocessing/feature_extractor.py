"""
Acoustic and biomechanical feature extraction module.
Extracts glottal jitter, shimmer, HNR, spectral centroid, and LFCC filterbanks.
"""
import numpy as np
from scipy.fft import rfft, rfftfreq, dct

def extract_pitch_f0(samples: np.ndarray, sr: int = 16000) -> tuple[float, list[float]]:
    """Extracts fundamental frequency (F0) with parabolic interpolation and adaptive voicing."""
    frame_len = int(sr * 0.040)
    hop_len = int(sr * 0.015)
    min_lag = int(sr / 450.0)
    max_lag = int(sr / 65.0)

    f0_series = []
    for start in range(0, len(samples) - frame_len, hop_len):
        frame = samples[start:start + frame_len]
        if np.mean(frame ** 2) < 0.0001:
            continue
        windowed = (frame - np.mean(frame)) * np.hanning(frame_len)
        corr = np.correlate(windowed, windowed, mode="full")[frame_len - 1:]
        search_region = corr[min_lag:max_lag]
        if len(search_region) == 0:
            continue
        peak_idx = int(np.argmax(search_region)) + min_lag
        zero_lag = corr[0] + 1e-9

        # Parabolic lag interpolation for sub-sample precision
        if 0 < peak_idx < len(corr) - 1:
            a, b, c = corr[peak_idx - 1], corr[peak_idx], corr[peak_idx + 1]
            delta = (a - c) / (2 * (a - 2 * b + c) + 1e-9)
            refined_lag = peak_idx + np.clip(delta, -0.5, 0.5)
        else:
            refined_lag = float(peak_idx)

        if (corr[peak_idx] / zero_lag) > 0.22 and refined_lag > 0:
            f0 = sr / float(refined_lag)
            if 65.0 <= f0 <= 450.0:
                f0_series.append(f0)

    mean_f0 = float(np.mean(f0_series)) if f0_series else 135.0
    return mean_f0, f0_series

def compute_jitter_ppq5(f0_series: list[float]) -> float:
    """Computes Glottal Jitter PPQ5 without biased human defaults."""
    if len(f0_series) < 3:
        return 0.15
    periods = [1.0 / f for f in f0_series if f > 0]
    n = len(periods)
    if n >= 5:
        diffs = [abs(periods[i] - np.mean(periods[max(0, i - 2):min(n, i + 3)])) for i in range(2, n - 2)]
    else:
        diffs = [abs(periods[i] - periods[i - 1]) for i in range(1, n)]
    mean_p = np.mean(periods)
    if mean_p <= 0 or not diffs:
        return 0.15
    return round(float((np.mean(diffs) / mean_p) * 100.0), 3)

def compute_shimmer_apq3(samples: np.ndarray, sr: int = 16000) -> float:
    """Computes Glottal Shimmer APQ3 without biased human defaults."""
    frame_len = int(sr * 0.025)
    hop = int(sr * 0.0125)
    amplitudes = [
        float(np.max(np.abs(samples[i:i + frame_len])))
        for i in range(0, len(samples) - frame_len, hop)
        if np.max(np.abs(samples[i:i + frame_len])) > 0.005
    ]
    if len(amplitudes) < 3:
        return 0.65
    n = len(amplitudes)
    diffs = [abs(amplitudes[i] - np.mean(amplitudes[max(0, i - 1):min(n, i + 2)])) for i in range(1, n - 1)]
    mean_a = np.mean(amplitudes)
    if mean_a <= 0 or not diffs:
        return 0.65
    return round(float((np.mean(diffs) / mean_a) * 100.0), 3)

def compute_hnr(samples: np.ndarray, sr: int = 16000) -> float:
    """Computes Harmonic-to-Noise Ratio (HNR) in decibels."""
    frame_len = int(sr * 0.030)
    if len(samples) < frame_len:
        return 16.0
    frame = samples[:frame_len] * np.hanning(frame_len)
    corr = np.correlate(frame, frame, mode="full")[frame_len - 1:]
    min_lag = int(sr / 450.0)
    max_lag = int(sr / 65.0)
    search = corr[min_lag:max_lag]
    if len(search) == 0 or corr[0] <= 0:
        return 16.0
    peak = np.max(search)
    ratio = peak / (corr[0] - peak + 1e-9)
    if ratio <= 0:
        return 16.0
    return round(float(np.clip(10.0 * np.log10(ratio), 4.0, 36.0)), 1)

def compute_spectral_features(samples: np.ndarray, sr: int = 16000) -> dict:
    """Computes spectral centroid, 85% rolloff, and vocoder high-frequency ratio."""
    window = samples * np.hanning(len(samples))
    mags = np.abs(rfft(window))
    freqs = rfftfreq(len(samples), 1.0 / sr)
    total_energy = np.sum(mags) + 1e-9

    centroid = float(np.sum(freqs * mags) / total_energy)
    cumsum = np.cumsum(mags)
    rolloff_idx = np.searchsorted(cumsum, 0.85 * total_energy)
    rolloff = float(freqs[min(rolloff_idx, len(freqs) - 1)])

    hf_mask = freqs >= 3800
    hf_ratio = float(np.sum(mags[hf_mask]) / total_energy)

    return {
        "centroid": round(centroid, 1),
        "rolloff": round(rolloff, 1),
        "hf_ratio": round(hf_ratio, 4)
    }

def compute_lfcc_vector(samples: np.ndarray, sr: int = 16000, n_filters: int = 24, n_ceps: int = 12) -> np.ndarray:
    """Computes Linear Frequency Cepstral Coefficients (LFCC) across linear filterbanks."""
    n_fft = 512
    mags = np.abs(rfft(samples[:n_fft] * np.hanning(min(len(samples), n_fft)), n=n_fft))
    linear_points = np.linspace(0, sr / 2, n_filters + 2)
    fft_freqs = rfftfreq(n_fft, 1.0 / sr)

    filter_energies = np.zeros(n_filters)
    for i in range(n_filters):
        f_left, f_mid, f_right = linear_points[i], linear_points[i + 1], linear_points[i + 2]
        tri = np.maximum(0, 1 - np.abs(fft_freqs - f_mid) / (f_mid - f_left + 1e-9))
        filter_energies[i] = np.sum(mags * tri)

    log_energies = np.log(filter_energies + 1e-9)
    return dct(log_energies, type=2, norm="ortho")[:n_ceps]

def extract_feature_vector(samples: np.ndarray, sr: int = 16000) -> np.ndarray:
    """Combines all acoustic and biomechanical metrics into a standardized 19-dim feature vector."""
    f0_mean, f0_series = extract_pitch_f0(samples, sr)
    jitter = compute_jitter_ppq5(f0_series)
    shimmer = compute_shimmer_apq3(samples, sr)
    hnr = compute_hnr(samples, sr)
    spectral = compute_spectral_features(samples, sr)
    lfcc = compute_lfcc_vector(samples, sr)

    base_features = np.array([
        f0_mean, jitter, shimmer, hnr,
        spectral["centroid"], spectral["rolloff"], spectral["hf_ratio"]
    ], dtype=np.float32)

    return np.concatenate([base_features, lfcc.astype(np.float32)])
