"""
Unit and integration tests for VoiceShield AI 10-20s inference and LLM risk explainer.
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
from AI.preprocessing.temporal_processor import extract_temporal_feature_vector
from AI.inference.llm_explainer import generate_risk_explanation

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

    def test_short_audio_inconclusive(self):
        short_audio = np.random.randn(3200).astype(np.float32) # 200ms
        res = self.detector.analyze_waveform(short_audio, 16000)
        self.assertEqual(res["label"], "Inconclusive")
        self.assertEqual(res["status"], "inconclusive")
        self.assertIn("llm_risk_explanation", res)

    def test_silence_inconclusive(self):
        silence = np.zeros(16000, dtype=np.float32)
        res = self.detector.analyze_waveform(silence, 16000)
        self.assertEqual(res["label"], "Inconclusive")

    def test_10_to_20_second_audio_processing(self):
        # 12 seconds of synthetic-like speech at 16kHz = 192,000 samples
        sr = 16000
        duration = 12.0
        t = np.linspace(0, duration, int(sr * duration))
        carrier = 0.35 * np.sin(2 * np.pi * 140 * t)
        noise = 0.05 * np.random.randn(len(t))
        waveform = (carrier + noise).astype(np.float32)

        res = self.detector.analyze_waveform(waveform, sr)
        self.assertIn(res["label"], ["Likely Human Speech", "Potentially AI-Generated Speech", "Inconclusive"])
        self.assertIn("confidence", res)
        self.assertIn("segments", res)
        self.assertGreaterEqual(res["segments_count"], 15) # Multiple segments over 12s
        self.assertIn("temporal_dynamics", res)
        self.assertIn("llm_risk_explanation", res)

        expl = res["llm_risk_explanation"]
        self.assertIn("summary", expl)
        self.assertIn("recommendation", expl)

    def test_llm_explainer_direct_call(self):
        mock_result = {
            "label": "Potentially AI-Generated Speech",
            "synthetic_probability": 88.5,
            "metrics": {
                "duration_seconds": 15.0,
                "jitter_ppq": 0.08,
                "shimmer_apq": 0.42,
                "hnr_db": 30.5,
                "vocoder_signature": "HiFi-GAN v1 / Diffusion Synthesizer"
            }
        }
        expl = generate_risk_explanation(mock_result)
        self.assertIn("summary", expl)
        self.assertIn("HIGH_RISK", expl["recommendation"])

    def test_5s_timeline_and_production_llm(self):
        sr = 16000
        waveform = (0.2 * np.random.randn(sr * 15)).astype(np.float32)
        res = self.detector.analyze_waveform(waveform, sr)
        self.assertIn("timeline_5s_intervals", res)
        self.assertEqual(len(res["timeline_5s_intervals"]), 3)
        self.assertIn("comparison_metrics", res)
        self.assertIn("jitter", res["comparison_metrics"])

        expl = res["llm_risk_explanation"]
        self.assertIn("threat_tier", expl)
        self.assertIn("timeline_logs", expl)
        self.assertEqual(len(expl["timeline_logs"]), 3)

if __name__ == "__main__":
    unittest.main()
