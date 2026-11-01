"""
Verification and regression tests for multi-view acoustic, spectral, phase, and prosodic features.
Validates LFCC (60, 401), MFCC (60, 401), Log-Spec (257, 401), Phase velocity, and CMVN.
"""
import os
import sys
import unittest
import numpy as np

root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from AI.features.cepstral_extractor import (
    extract_lfcc,
    extract_mfcc,
    compute_deltas,
    apply_cmvn
)
from AI.features.spectral_phase_extractor import (
    compute_complex_stft,
    compute_log_spectrogram,
    compute_phase_derivative,
    compute_spectral_flux,
    compute_spectral_flatness
)
from AI.features.prosodic_extractor import (
    track_f0_contour,
    compute_jitter_ppq,
    compute_shimmer_apq,
    compute_hnr_db,
    extract_prosodic_profile
)
from AI.features.unified_extractor import UnifiedForensicFeatureExtractor

class TestFeatureExtraction(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sr = 16000
        cls.n_samples = 64000  # 4.0s @ 16kHz
        t = np.linspace(0, 4.0, cls.n_samples)
        # Synthetic speech harmonic carrier: 140Hz fundamental + 280Hz + 420Hz harmonics
        carrier = 0.3 * np.sin(2 * np.pi * 140 * t) + 0.15 * np.sin(2 * np.pi * 280 * t)
        noise = 0.02 * np.random.randn(cls.n_samples)
        cls.clean_waveform = (carrier + noise).astype(np.float32)
        cls.extractor = UnifiedForensicFeatureExtractor(sr=cls.sr)

    def test_cepstral_shapes_and_cmvn(self):
        """Validates 60-dim LFCC and MFCC shapes (60, 401) and CMVN normalization."""
        lfcc = extract_lfcc(self.clean_waveform, sr=self.sr)
        mfcc = extract_mfcc(self.clean_waveform, sr=self.sr)

        self.assertEqual(lfcc.shape, (60, 401))
        self.assertEqual(mfcc.shape, (60, 401))
        self.assertEqual(lfcc.dtype, np.float32)
        self.assertEqual(mfcc.dtype, np.float32)

        # CMVN verification: zero mean and unit variance across time (axis 1)
        mean_lfcc = np.mean(lfcc, axis=1)
        std_lfcc = np.std(lfcc, axis=1)
        self.assertTrue(np.allclose(mean_lfcc, 0.0, atol=1e-4))
        self.assertTrue(np.allclose(std_lfcc, 1.0, atol=1e-2))

    def test_spectral_and_phase_discontinuity_features(self):
        """Validates STFT (257, 401), Log-Spectrogram, and Phase Derivative."""
        c_stft = compute_complex_stft(self.clean_waveform)
        self.assertEqual(c_stft.shape, (257, 401))

        log_spec = compute_log_spectrogram(c_stft)
        self.assertEqual(log_spec.shape, (257, 401))
        self.assertFalse(np.isnan(log_spec).any())

        phase_d = compute_phase_derivative(c_stft)
        self.assertEqual(phase_d.shape, (257, 401))
        self.assertFalse(np.isnan(phase_d).any())

        flux = compute_spectral_flux(np.abs(c_stft))
        flatness = compute_spectral_flatness(np.abs(c_stft))
        self.assertEqual(len(flux), 401)
        self.assertEqual(len(flatness), 401)
        self.assertTrue(np.all(flatness >= 0.0) and np.all(flatness <= 1.0))

    def test_prosodic_and_glottal_extraction(self):
        """Validates pitch tracking, jitter, shimmer, HNR, and rhythm metrics."""
        f0_contour, voiced_mask = track_f0_contour(self.clean_waveform, self.sr)
        self.assertGreater(len(f0_contour), 100)
        self.assertTrue(np.any(voiced_mask))

        profile = extract_prosodic_profile(self.clean_waveform, self.sr)
        self.assertIn("f0_mean", profile)
        self.assertIn("jitter_ppq", profile)
        self.assertIn("shimmer_apq", profile)
        self.assertIn("hnr_db", profile)
        self.assertIn("pause_ratio", profile)
        self.assertGreater(profile["f0_mean"], 100.0)
        self.assertLess(profile["f0_mean"], 200.0)

    def test_unified_extractor_bundle(self):
        """Validates full bundle extraction on 64,000 samples."""
        bundle = self.extractor.extract_features(self.clean_waveform)
        self.assertEqual(bundle["lfcc"].shape, (60, 401))
        self.assertEqual(bundle["mfcc"].shape, (60, 401))
        self.assertEqual(bundle["spectrogram"].shape, (257, 401))
        self.assertEqual(bundle["phase_derivative"].shape, (257, 401))
        self.assertEqual(bundle["spectral_flux"].shape, (401,))
        self.assertEqual(bundle["spectral_flatness"].shape, (401,))
        self.assertGreater(len(bundle["pooled_vector"]), 50)
        self.assertFalse(np.isnan(bundle["pooled_vector"]).any())

    def test_edge_case_near_silence(self):
        """Near-silent audio must extract without NaN or Inf propagation."""
        silent_signal = (1e-6 * np.random.randn(self.n_samples)).astype(np.float32)
        bundle = self.extractor.extract_features(silent_signal)
        self.assertFalse(np.isnan(bundle["lfcc"]).any())
        self.assertFalse(np.isinf(bundle["lfcc"]).any())
        self.assertFalse(np.isnan(bundle["spectrogram"]).any())
        self.assertFalse(np.isnan(bundle["pooled_vector"]).any())

    def test_edge_case_dc_offset_and_clipping(self):
        """Constant DC offset and clipped waveforms must be numerically stable."""
        clipped_signal = np.clip(10.0 * self.clean_waveform + 0.5, -0.99, 0.99)
        bundle = self.extractor.extract_features(clipped_signal)
        self.assertEqual(bundle["lfcc"].shape, (60, 401))
        self.assertFalse(np.isnan(bundle["pooled_vector"]).any())

if __name__ == "__main__":
    unittest.main()

