"""
Audio normalization, decoding, and resampling utilities.
Converts any arbitrary incoming audio stream or file to uniform 16kHz mono float32.
"""
import io
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

from AI.configs.inference_config import TARGET_SAMPLE_RATE, ENERGY_THRESHOLD_RMS

def decode_audio_bytes(data: bytes) -> tuple[np.ndarray, int]:
    """
    Decodes audio bytes (WAV, MP3, FLAC, OGG, WebM) into a float32 numpy array.
    Falls back to raw 16-bit PCM if container headers are absent.
    """
    try:
        with io.BytesIO(data) as bio:
            samples, sr = sf.read(bio, dtype="float32", always_2d=False)
            return samples, sr
    except Exception:
        # Fallback: treat as raw 16kHz 16-bit signed PCM mono
        int_data = np.frombuffer(data, dtype=np.int16)
        samples = int_data.astype(np.float32) / 32768.0
        return samples, TARGET_SAMPLE_RATE

def to_mono_16k(samples: np.ndarray, sr: int) -> np.ndarray:
    """
    Converts multi-channel audio to mono and resamples to target 16,000 Hz.
    """
    if samples.ndim > 1:
        samples = np.mean(samples, axis=1)

    samples = samples.astype(np.float32)

    if sr != TARGET_SAMPLE_RATE and sr > 0:
        gcd = np.gcd(sr, TARGET_SAMPLE_RATE)
        up = TARGET_SAMPLE_RATE // gcd
        down = sr // gcd
        samples = resample_poly(samples, up, down).astype(np.float32)

    return samples

def compute_rms(samples: np.ndarray) -> float:
    """Computes Root Mean Square (RMS) energy."""
    if len(samples) == 0:
        return 0.0
    return float(np.sqrt(np.mean(samples**2) + 1e-12))

def normalize_rms(samples: np.ndarray, target_rms: float = 0.1) -> np.ndarray:
    """Normalizes audio volume to target RMS energy to remove recording level bias."""
    current_rms = compute_rms(samples)
    if current_rms < 1e-6:
        return samples
    gain = target_rms / current_rms
    normalized = samples * gain
    # Soft limiter to prevent digital clipping
    return np.clip(normalized, -0.99, 0.99).astype(np.float32)

def is_speech_present(samples: np.ndarray, threshold: float = ENERGY_THRESHOLD_RMS) -> bool:
    """Determines whether audio segment contains sufficient acoustic energy for analysis."""
    return compute_rms(samples) >= threshold
