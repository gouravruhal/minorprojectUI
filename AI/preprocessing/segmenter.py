"""
Audio segmentation module.
Splits continuous or batch audio streams into windowed analysis chunks with overlap.
"""
from typing import Generator
import numpy as np

def segment_audio(
    samples: np.ndarray,
    sr: int = 16000,
    window_sec: float = 1.0,
    hop_sec: float = 0.5
) -> Generator[tuple[np.ndarray, float, float], None, None]:
    """
    Slices a continuous audio stream into overlapping analysis windows.
    Yields (segment_samples, start_time_sec, end_time_sec).
    """
    window_samples = int(sr * window_sec)
    hop_samples = int(sr * hop_sec)
    total_len = len(samples)

    if total_len <= window_samples:
        yield samples, 0.0, float(total_len) / float(sr)
        return

    for start in range(0, total_len - window_samples + 1, hop_samples):
        end = start + window_samples
        start_sec = round(float(start) / float(sr), 2)
        end_sec = round(float(end) / float(sr), 2)
        yield samples[start:end], start_sec, end_sec

    # Catch trailing remnant chunk if longer than minimum window
    remnant_start = total_len - window_samples
    if remnant_start > 0 and (total_len % hop_samples) != 0:
        start_sec = round(float(remnant_start) / float(sr), 2)
        end_sec = round(float(total_len) / float(sr), 2)
        yield samples[remnant_start:total_len], start_sec, end_sec

