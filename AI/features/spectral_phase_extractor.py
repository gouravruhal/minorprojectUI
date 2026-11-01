"""
Spectral and Phase Discontinuity Feature Extractor.
Extracts Log-Power Spectrogram, Complex STFT, Instantaneous Phase Velocity,
Spectral Flux, and Spectral Flatness for vocoder artifact detection.
"""
from typing import Dict, Any, Tuple
import numpy as np
from scipy.fft import rfft

def compute_complex_stft(
    waveform: np.ndarray,
    n_fft: int = 512,
    win_len: int = 400,
    hop_len: int = 160
) -> np.ndarray:
    """Computes complex STFT with centered reflect padding. Shape: (257, 401)."""
    pad_len = n_fft // 2
    padded = np.pad(waveform, (pad_len, pad_len), mode="reflect")
    window = np.hanning(win_len)
    win_pad = np.pad(window, (0, n_fft - win_len))

    frames = []
    for start in range(0, len(padded) - n_fft + 1, hop_len):
        chunk = padded[start:start + n_fft] * win_pad
        spec = rfft(chunk, n=n_fft)
        frames.append(spec)
    return np.array(frames, dtype=np.complex64).T

def compute_log_spectrogram(stft_matrix: np.ndarray) -> np.ndarray:
    """Extracts Log-Power Spectrogram: log(|X|^2 + 1e-9). Shape: (257, 401)."""
    power = np.abs(stft_matrix) ** 2
    return np.log(power + 1e-9).astype(np.float32)

def compute_phase_derivative(stft_matrix: np.ndarray) -> np.ndarray:
    """
    Computes instantaneous phase derivative across adjacent time frames.
    Exposes vocoder phase discontinuities in unvoiced/voiced transitions.
    Shape: (257, 401).
    """
    n_bins, n_frames = stft_matrix.shape
    if n_frames < 2:
        return np.zeros((n_bins, n_frames), dtype=np.float32)

    # Cross-spectral product: X_t * conj(X_{t-1})
    cross_spec = stft_matrix[:, 1:] * np.conj(stft_matrix[:, :-1])
    d_phi = np.angle(cross_spec)

    # Pad first column to preserve exact (n_bins, n_frames) geometry
    padded_d_phi = np.pad(d_phi, ((0, 0), (1, 0)), mode="edge")
    return padded_d_phi.astype(np.float32)

def compute_spectral_flux(mags: np.ndarray) -> np.ndarray:
    """Computes normalized spectral flux (frame-to-frame spectral energy velocity). Shape: (401,)."""
    n_bins, n_frames = mags.shape
    if n_frames < 2:
        return np.zeros(n_frames, dtype=np.float32)

    diff = np.diff(mags, axis=1)
    flux = np.sqrt(np.mean(diff ** 2, axis=0))
    padded_flux = np.pad(flux, (1, 0), mode="edge")
    return padded_flux.astype(np.float32)

def compute_spectral_flatness(mags: np.ndarray) -> np.ndarray:
    """Computes Wiener entropy / Spectral Flatness Measure (SFM) per frame. Shape: (401,)."""
    power = (mags ** 2) + 1e-12
    # Geometric mean / Arithmetic mean
    log_power = np.log(power)
    geom_mean = np.exp(np.mean(log_power, axis=0))
    arith_mean = np.mean(power, axis=0)
    sfm = geom_mean / (arith_mean + 1e-9)
    return np.clip(sfm, 0.0, 1.0).astype(np.float32)

def extract_spectral_phase_bundle(
    waveform: np.ndarray,
    sr: int = 16000,
    n_fft: int = 512,
    win_len: int = 400,
    hop_len: int = 160
) -> Dict[str, Any]:
    """Extracts unified high-resolution time-frequency and phase features."""
    c_stft = compute_complex_stft(waveform, n_fft, win_len, hop_len)
    mags = np.abs(c_stft)
    log_spec = compute_log_spectrogram(c_stft)
    phase_d = compute_phase_derivative(c_stft)
    flux = compute_spectral_flux(mags)
    flatness = compute_spectral_flatness(mags)

    # Phase variance per frequency bin (unnatural phase jitter in synthetic speech)
    phase_var = np.var(phase_d, axis=1)

    return {
        "complex_stft": c_stft,
        "log_spectrogram": log_spec,
        "phase_derivative": phase_d,
        "phase_variance": phase_var.astype(np.float32),
        "spectral_flux": flux,
        "spectral_flatness": flatness
    }

