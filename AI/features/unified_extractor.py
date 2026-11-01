"""
Unified Forensic Multi-View Feature Extraction Engine.
Packages 60-dim LFCC, 60-dim MFCC, Log-Spectrogram, Phase Velocity, and Prosody.
Guarantees deterministic (60, 401) temporal geometry for 64,000-sample inputs.
"""
from typing import Dict, Any, Optional
import numpy as np

try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

from AI.features.cepstral_extractor import extract_lfcc, extract_mfcc
from AI.features.spectral_phase_extractor import extract_spectral_phase_bundle
from AI.features.prosodic_extractor import extract_prosodic_profile

class UnifiedForensicFeatureExtractor:
    """Production multi-view acoustic, spectral, phase, and prosodic feature extractor."""

    def __init__(
        self,
        sr: int = 16000,
        n_fft: int = 512,
        win_len: int = 400,
        hop_len: int = 160,
        n_filters: int = 20,
        n_ceps: int = 20
    ):
        self.sr = sr
        self.n_fft = n_fft
        self.win_len = win_len
        self.hop_len = hop_len
        self.n_filters = n_filters
        self.n_ceps = n_ceps

    def extract_features(self, waveform: np.ndarray) -> Dict[str, Any]:
        """
        Extracts multi-view forensic representations from sanitized (64000,) audio.
        Returns deterministic arrays:
          - lfcc: (60, 401)
          - mfcc: (60, 401)
          - spectrogram: (257, 401)
          - phase_derivative: (257, 401)
          - spectral_flux: (401,)
          - spectral_flatness: (401,)
          - prosody: dict of scalar metrics
        """
        # Fallback for silent/short waveforms
        if len(waveform) == 0:
            waveform = np.zeros(64000, dtype=np.float32)

        # 1. Cepstral Multi-View (LFCC + MFCC with Deltas & CMVN)
        lfcc = extract_lfcc(
            waveform, sr=self.sr, n_fft=self.n_fft,
            win_len=self.win_len, hop_len=self.hop_len,
            n_filters=self.n_filters, n_ceps=self.n_ceps
        )
        mfcc = extract_mfcc(
            waveform, sr=self.sr, n_fft=self.n_fft,
            win_len=self.win_len, hop_len=self.hop_len,
            n_filters=self.n_filters, n_ceps=self.n_ceps
        )

        # 2. Spectral & Phase Discontinuity
        spec_phase = extract_spectral_phase_bundle(
            waveform, sr=self.sr, n_fft=self.n_fft,
            win_len=self.win_len, hop_len=self.hop_len
        )

        # 3. Prosodic & Micro-Modulation
        prosody = extract_prosodic_profile(waveform, sr=self.sr)

        # 4. Global Pooled Forensic Representation (for tree/tabular backbones)
        pooled_lfcc = np.concatenate([np.mean(lfcc, axis=1), np.std(lfcc, axis=1)])
        pooled_mfcc = np.concatenate([np.mean(mfcc, axis=1), np.std(mfcc, axis=1)])
        phase_stats = np.array([
            float(np.mean(spec_phase["phase_variance"])),
            float(np.std(spec_phase["phase_variance"])),
            float(np.mean(spec_phase["spectral_flux"])),
            float(np.mean(spec_phase["spectral_flatness"]))
        ], dtype=np.float32)

        prosody_vals = np.array([
            prosody["f0_mean"], prosody["f0_std"], prosody["f0_stability"],
            prosody["vu_ratio"], prosody["jitter_ppq"], prosody["shimmer_apq"],
            prosody["hnr_db"], prosody["spectral_centroid"], prosody["spectral_rolloff"],
            prosody["pause_ratio"], prosody["pause_count"], prosody["mean_pause_ms"]
        ], dtype=np.float32)

        pooled_vector = np.concatenate([pooled_lfcc, pooled_mfcc, phase_stats, prosody_vals])

        # Numerical Safeguard: strip any NaN/Inf
        np.nan_to_num(lfcc, copy=False)
        np.nan_to_num(mfcc, copy=False)
        np.nan_to_num(spec_phase["log_spectrogram"], copy=False)
        np.nan_to_num(spec_phase["phase_derivative"], copy=False)
        np.nan_to_num(pooled_vector, copy=False)

        return {
            "lfcc": lfcc.astype(np.float32),
            "mfcc": mfcc.astype(np.float32),
            "spectrogram": spec_phase["log_spectrogram"],
            "phase_derivative": spec_phase["phase_derivative"],
            "spectral_flux": spec_phase["spectral_flux"],
            "spectral_flatness": spec_phase["spectral_flatness"],
            "phase_variance": spec_phase["phase_variance"],
            "prosody": prosody,
            "pooled_vector": pooled_vector.astype(np.float32)
        }

    def to_torch_tensors(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Converts feature dict into PyTorch tensors if PyTorch is available."""
        if not HAS_TORCH:
            return features
        torch_dict = {}
        for k, v in features.items():
            if isinstance(v, np.ndarray):
                torch_dict[k] = torch.from_numpy(v)
            else:
                torch_dict[k] = v
        return torch_dict

