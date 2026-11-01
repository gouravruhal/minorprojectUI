"""
Linear and Mel-Frequency Cepstral Feature Extractor with Deltas and CMVN.
Extracts 60-dim LFCC and 60-dim MFCC representations capturing vocoder artifacts.
"""
from typing import Tuple
import numpy as np
from scipy.fft import dct, rfft, rfftfreq

def compute_deltas(feats: np.ndarray, width: int = 5) -> np.ndarray:
    """
    Computes 1st or 2nd order regression derivatives along the time axis (axis=1).
    Input shape: (D, T), Output shape: (D, T).
    """
    d, t = feats.shape
    if t < 2:
        return np.zeros_like(feats)
    half_w = width // 2
    padded = np.pad(feats, ((0, 0), (half_w, half_w)), mode="edge")
    kernel = np.arange(-half_w, half_w + 1, dtype=np.float32)
    denom = 2.0 * np.sum(np.arange(1, half_w + 1) ** 2) + 1e-9

    deltas = np.zeros_like(feats)
    for i in range(t):
        window = padded[:, i:i + width]
        deltas[:, i] = np.sum(window * kernel, axis=1) / denom
    return deltas.astype(np.float32)

def apply_cmvn(feats: np.ndarray) -> np.ndarray:
    """Applies utterance-level Cepstral Mean and Variance Normalization across time."""
    mean = np.mean(feats, axis=1, keepdims=True)
    std = np.std(feats, axis=1, keepdims=True)
    return ((feats - mean) / (std + 1e-8)).astype(np.float32)

def get_linear_filterbank(sr: int = 16000, n_fft: int = 512, n_filters: int = 20) -> np.ndarray:
    """Constructs linearly spaced triangular filterbank from 0 to sr/2 (8 kHz)."""
    fft_freqs = rfftfreq(n_fft, 1.0 / sr)
    linear_points = np.linspace(0.0, sr / 2.0, n_filters + 2)
    fbank = np.zeros((n_filters, len(fft_freqs)), dtype=np.float32)
    for m in range(n_filters):
        f_left, f_mid, f_right = linear_points[m], linear_points[m + 1], linear_points[m + 2]
        tri = np.maximum(0.0, 1.0 - np.abs(fft_freqs - f_mid) / (f_mid - f_left + 1e-9))
        fbank[m] = tri
    return fbank

def get_mel_filterbank(sr: int = 16000, n_fft: int = 512, n_filters: int = 20) -> np.ndarray:
    """Constructs Mel-spaced triangular filterbank from 0 to sr/2 (8 kHz)."""
    fft_freqs = rfftfreq(n_fft, 1.0 / sr)
    mel_min = 2595.0 * np.log10(1.0 + 0.0 / 700.0)
    mel_max = 2595.0 * np.log10(1.0 + (sr / 2.0) / 700.0)
    mel_points = np.linspace(mel_min, mel_max, n_filters + 2)
    hz_points = 700.0 * (10.0 ** (mel_points / 2595.0) - 1.0)

    fbank = np.zeros((n_filters, len(fft_freqs)), dtype=np.float32)
    for m in range(n_filters):
        f_left, f_mid, f_right = hz_points[m], hz_points[m + 1], hz_points[m + 2]
        tri = np.maximum(0.0, 1.0 - np.abs(fft_freqs - f_mid) / (f_mid - f_left + 1e-9))
        fbank[m] = tri
    return fbank

def frame_stft_magnitudes(
    waveform: np.ndarray,
    n_fft: int = 512,
    win_len: int = 400,
    hop_len: int = 160
) -> np.ndarray:
    """Computes STFT magnitude frames with centered reflect padding. Shape: (n_bins, n_frames)."""
    pad_len = n_fft // 2
    padded = np.pad(waveform, (pad_len, pad_len), mode="reflect")
    window = np.hanning(win_len)
    win_pad = np.pad(window, (0, n_fft - win_len))

    frames = []
    for start in range(0, len(padded) - n_fft + 1, hop_len):
        chunk = padded[start:start + n_fft] * win_pad
        mag = np.abs(rfft(chunk, n=n_fft))
        frames.append(mag)
    return np.array(frames, dtype=np.float32).T

def extract_lfcc(
    waveform: np.ndarray,
    sr: int = 16000,
    n_fft: int = 512,
    win_len: int = 400,
    hop_len: int = 160,
    n_filters: int = 20,
    n_ceps: int = 20
) -> np.ndarray:
    """
    Extracts 60-dim LFCC representation (20 Static + 20 Delta + 20 Delta-Delta) with CMVN.
    Output shape: (60, 401) for 64,000-sample input.
    """
    mags = frame_stft_magnitudes(waveform, n_fft, win_len, hop_len)
    fbank = get_linear_filterbank(sr, n_fft, n_filters)
    filter_energies = np.dot(fbank, mags) + 1e-9
    log_energies = np.log(filter_energies)

    # DCT Type-II along filter dimension
    static = dct(log_energies, type=2, axis=0, norm="ortho")[:n_ceps]
    delta = compute_deltas(static, width=5)
    delta2 = compute_deltas(delta, width=5)
    feats = np.concatenate([static, delta, delta2], axis=0)
    return apply_cmvn(feats)

def extract_mfcc(
    waveform: np.ndarray,
    sr: int = 16000,
    n_fft: int = 512,
    win_len: int = 400,
    hop_len: int = 160,
    n_filters: int = 20,
    n_ceps: int = 20
) -> np.ndarray:
    """
    Extracts 60-dim MFCC representation (20 Static + 20 Delta + 20 Delta-Delta) with CMVN.
    Output shape: (60, 401) for 64,000-sample input.
    """
    mags = frame_stft_magnitudes(waveform, n_fft, win_len, hop_len)
    fbank = get_mel_filterbank(sr, n_fft, n_filters)
    filter_energies = np.dot(fbank, mags) + 1e-9
    log_energies = np.log(filter_energies)

    static = dct(log_energies, type=2, axis=0, norm="ortho")[:n_ceps]
    delta = compute_deltas(static, width=5)
    delta2 = compute_deltas(delta, width=5)
    feats = np.concatenate([static, delta, delta2], axis=0)
    return apply_cmvn(feats)

