"""
Unit and integration tests for the AI preprocessing and inference pipeline.
"""
import os
import sys
import unittest
import numpy as np

root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from AI.inference.detector import VoiceDeepfakeDetector
from AI.preprocessing.audio_normalizer import to_mono_16k, normalize_rms, compute_rms
from AI.preprocessing.feature_extractor import extract_feature_vector

class TestAIInference(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.detector = VoiceDeepfakeDetector()

    def test_audio_normalization(self):
        stereo_48k = np.random.randn(48000, 2).astype(np.float32)
        mono_16k = to_mono_16k(stereo_48k, 48000)
        self.assertEqual(mono_16k.ndim, 1)
        self.assertEqual(len(mono_16k), 16000)

        norm = normalize_rms(mono_16k, target_rms=0.1)
        self.assertAlmostEqual(compute_rms(norm), 0.1, places=2)

    def test_feature_extraction(self):
        t = np.linspace(0, 1.0, 16000)
        sine_wave = (0.5 * np.sin(2 * np.pi * 140 * t)).astype(np.float32)
        f_vec = extract_feature_vector(sine_wave, 16000)
        self.assertEqual(len(f_vec), 19)
        self.assertGreater(f_vec[0], 100.0)

    def test_short_audio_inconclusive(self):
        short_audio = np.random.randn(3200).astype(np.float32) # 200ms
        res = self.detector.analyze_waveform(short_audio, 16000)
        self.assertEqual(res["label"], "Inconclusive")
        self.assertEqual(res["status"], "inconclusive")

    def test_silence_inconclusive(self):
        silence = np.zeros(16000, dtype=np.float32)
        res = self.detector.analyze_waveform(silence, 16000)
        self.assertEqual(res["label"], "Inconclusive")

    def test_end_to_end_waveform_report(self):
        t = np.linspace(0, 1.5, 24000)
        speech_like = (0.3 * np.sin(2 * np.pi * 150 * t) + 0.1 * np.random.randn(24000)).astype(np.float32)
        res = self.detector.analyze_waveform(speech_like, 16000)
        self.assertIn(res["label"], ["Likely Human Speech", "Potentially AI-Generated Speech", "Inconclusive"])
        self.assertIn("confidence", res)
        self.assertIn("metrics", res)
        self.assertIn("segments", res)
        self.assertIn("disclaimer", res)

if __name__ == "__main__":
    unittest.main()

