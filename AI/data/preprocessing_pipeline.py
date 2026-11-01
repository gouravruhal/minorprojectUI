"""
Deterministic Audio Forensic Preprocessing Pipeline.
Enforces 16kHz Kaiser polyphase resampling, 40Hz Butterworth high-pass,
Frame-Energy VAD with hangover margins, RMS loudness soft-limiting, and 4.0s temporal framing.
"""
from typing import Optional, List, Tuple
import numpy as np
from scipy.signal import butter, sosfiltfilt, resample_poly, windows

class AudioPreprocessor:
    """Production audio signal sanitization and temporal framing processor."""

    def __init__(
        self,
        target_sr: int = 16000,
        target_duration_sec: float = 4.0,
        target_rms: float = 0.10,
        hp_cutoff: float = 40.0
    ):
        self.target_sr = target_sr
        self.target_samples = int(target_sr * target_duration_sec)  # 64,000 samples
        self.target_rms = target_rms
        self.hp_cutoff = hp_cutoff
        # 4th-order Butterworth high-pass filter at 40 Hz
        self.sos = butter(4, hp_cutoff, btype="highpass", fs=target_sr, output="sos")

    def to_mono(self, audio: np.ndarray) -> np.ndarray:
        """Converts multi-channel signal to single-channel 1D array."""
        if audio.ndim == 2:
            return np.mean(audio, axis=1 if audio.shape[1] < audio.shape[0] else 0)
        return audio.squeeze()

    def resample_polyphase(self, audio: np.ndarray, orig_sr: int) -> np.ndarray:
        """Resamples to target_sr using polyphase sinc with Kaiser window."""
        if orig_sr == self.target_sr or orig_sr <= 0:
            return audio.astype(np.float32)
        gcd = np.gcd(orig_sr, self.target_sr)
        up = self.target_sr // gcd
        down = orig_sr // gcd
        # Anti-aliasing FIR filter via Kaiser window design
        resampled = resample_poly(audio, up, down, window=("kaiser", 5.0))
        return resampled.astype(np.float32)

    def highpass_filter(self, audio: np.ndarray) -> np.ndarray:
        """4th-order Butterworth filter stripping DC offset and sub-40Hz rumble."""
        if len(audio) < 32:
            return audio
        # sosfiltfilt provides zero phase distortion
        return sosfiltfilt(self.sos, audio).astype(np.float32)

    def trim_silence_vad(
        self,
        audio: np.ndarray,
        frame_ms: float = 25.0,
        hop_ms: float = 10.0,
        pre_onset_ms: float = 150.0,
        post_offset_ms: float = 200.0
    ) -> np.ndarray:
        """Frame-energy VAD stripping leading/trailing silence with hangover margins."""
        frame_len = int(self.target_sr * (frame_ms / 1000.0))  # 400
        hop_len = int(self.target_sr * (hop_ms / 1000.0))      # 160
        pre_onset_samples = int(self.target_sr * (pre_onset_ms / 1000.0))    # 2400
        post_offset_samples = int(self.target_sr * (post_offset_ms / 1000.0))  # 3200

        if len(audio) < frame_len:
            return audio

        frames = [audio[i:i + frame_len] for i in range(0, len(audio) - frame_len + 1, hop_len)]
        frame_rms = np.array([np.sqrt(np.mean(f**2) + 1e-12) for f in frames])
        silence_thresh = max(0.003, 0.08 * float(np.mean(frame_rms)))
        active_indices = np.where(frame_rms >= silence_thresh)[0]

        if len(active_indices) == 0:
            return audio  # Keep original if uniform ambient

        start_sample = max(0, int(active_indices[0] * hop_len) - pre_onset_samples)
        end_sample = min(len(audio), int(active_indices[-1] * hop_len + frame_len) + post_offset_samples)
        return audio[start_sample:end_sample].astype(np.float32)

    def normalize_rms_soft_limit(self, audio: np.ndarray) -> np.ndarray:
        """Target linear RMS normalization and tanh soft-knee limiting bounded at [-0.99, 0.99]."""
        rms = float(np.sqrt(np.mean(audio**2) + 1e-12))
        if rms > 1e-6:
            gain = self.target_rms / rms
            audio = audio * gain
        # Smooth soft-knee saturation: strictly bounded within [-0.99, 0.99]
        audio = 0.99 * np.tanh(audio / 0.99)
        return audio.astype(np.float32)

    def temporal_framing(self, audio: np.ndarray, mode: str = "train") -> np.ndarray:
        """Frames audio to 64,000 samples (4.0s @ 16kHz) via circular repeat or cropping."""
        n_samples = len(audio)
        if n_samples == self.target_samples:
            return audio

        if n_samples < self.target_samples:
            # Circular repeat padding: avoids zero-padding step discontinuities
            repeats = int(np.ceil(self.target_samples / max(1, n_samples)))
            tiled = np.tile(audio, repeats)
            return tiled[:self.target_samples].astype(np.float32)

        # Longer utterances (> 4.0s)
        if mode == "train":
            offset = np.random.randint(0, n_samples - self.target_samples + 1)
            return audio[offset:offset + self.target_samples].astype(np.float32)
        else:
            # Deterministic center crop for evaluation
            offset = (n_samples - self.target_samples) // 2
            return audio[offset:offset + self.target_samples].astype(np.float32)

    def strided_windows(
        self,
        audio: np.ndarray,
        window_sec: float = 4.0,
        hop_sec: float = 2.0
    ) -> List[Tuple[np.ndarray, float, float]]:
        """Extracts deterministic strided windows for evaluation / streaming."""
        win_len = int(self.target_sr * window_sec)
        hop_len = int(self.target_sr * hop_sec)
        if len(audio) <= win_len:
            framed = self.temporal_framing(audio, mode="eval")
            return [(framed, 0.0, round(len(audio) / self.target_sr, 2))]

        windows_out = []
        for start in range(0, len(audio) - win_len + 1, hop_len):
            end = start + win_len
            chunk = audio[start:end].astype(np.float32)
            windows_out.append((chunk, round(start / self.target_sr, 2), round(end / self.target_sr, 2)))
        if windows_out and (len(audio) - int(round(windows_out[-1][2] * self.target_sr))) >= int(0.5 * self.target_sr):
            chunk = audio[-win_len:].astype(np.float32)
            windows_out.append((chunk, round((len(audio) - win_len) / self.target_sr, 2), round(len(audio) / self.target_sr, 2)))
        return windows_out

    def sanitize(self, audio: np.ndarray, orig_sr: int) -> np.ndarray:
        """Runs deterministic sanitization: mono, polyphase sinc resample, HP filter, VAD, RMS."""
        sig = self.to_mono(audio)
        sig = self.resample_polyphase(sig, orig_sr)
        sig = self.highpass_filter(sig)
        sig = self.trim_silence_vad(sig)
        sig = self.normalize_rms_soft_limit(sig)
        return sig

    def process(self, audio: np.ndarray, orig_sr: int, mode: str = "train") -> np.ndarray:
        """Full sanitization and temporal framing returning exactly (64000,) float32."""
        sig = self.sanitize(audio, orig_sr)
        framed = self.temporal_framing(sig, mode=mode)
        # Final boundary safeguard
        framed = np.clip(framed, -0.99, 0.99).astype(np.float32)
        return framed

