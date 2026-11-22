"""
Unit tests for Model Selection Modes and Dual Risk Output Separation.
Verifies Acoustic-Only, Context-LLM-Only, and Dual-Model Fusion modes
with explicit voice detection risk and context threat risk outputs.
"""
import os
import sys
import unittest
import numpy as np

root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from backend.app.services.risk_engine import ForensicRiskEngine
from fastapi.testclient import TestClient
from backend.app.main import app

class TestModelSelectionAndDualRisk(unittest.TestCase):

    def setUp(self):
        self.engine = ForensicRiskEngine()
        self.client = TestClient(app)

    def test_acoustic_only_mode(self):
        res = self.engine.compute_risk(
            spoof_prob=0.85,
            attributions={"spectral_score": 0.8, "phase_score": 0.7, "prosodic_score": 0.8},
            dsp_features={"jitter_ppq": 0.15, "shimmer_apq": 0.9},
            context={"model_mode": "acoustic_only", "transaction_amount": 0}
        )
        self.assertEqual(res["analysis_mode"], "acoustic_only")
        self.assertGreaterEqual(res["voice_detection_risk"], 70.0)
        self.assertEqual(res["risk_score"], res["voice_detection_risk"])

    def test_context_llm_only_mode(self):
        res = self.engine.compute_risk(
            spoof_prob=0.10,
            attributions={"spectral_score": 0.1, "phase_score": 0.1, "prosodic_score": 0.1},
            dsp_features={"jitter_ppq": 0.95, "shimmer_apq": 2.5},
            context={"model_mode": "context_llm_only", "transaction_amount": 100000, "route_type": "voip"},
            speech_analysis={"semantic_threat_score": 85.0, "detected_phrases": [{"phrase": "urgent wire transfer"}]}
        )
        self.assertEqual(res["analysis_mode"], "context_llm_only")
        self.assertGreaterEqual(res["context_detection_risk"], 70.0)
        self.assertEqual(res["risk_score"], res["context_detection_risk"])

    def test_dual_model_fusion_mode(self):
        res = self.engine.compute_risk(
            spoof_prob=0.85,
            attributions={"spectral_score": 0.8, "phase_score": 0.7, "prosodic_score": 0.8},
            dsp_features={"jitter_ppq": 0.14, "shimmer_apq": 0.85},
            context={"model_mode": "both", "transaction_amount": 90000, "route_type": "voip"},
            speech_analysis={"semantic_threat_score": 80.0, "impersonation_claim_detected": True}
        )
        self.assertEqual(res["analysis_mode"], "dual_fusion")
        self.assertIn("voice_detection_risk", res)
        self.assertIn("context_detection_risk", res)
        self.assertGreaterEqual(res["risk_score"], 75.0)
        self.assertEqual(res["threat_tier"], "CRITICAL")

    def test_api_endpoint_model_mode_parameter(self):
        downloads_dir = os.path.join(root_dir, "downloads")
        sample_path = os.path.join(downloads_dir, "human_sample_1.wav")
        if os.path.exists(sample_path):
            with open(sample_path, "rb") as f:
                res = self.client.post(
                    "/api/v1/analyze-audio",
                    files={"file": ("human_sample_1.wav", f, "audio/wav")},
                    data={"model_mode": "acoustic_only", "transaction_amount": "5000"}
                )
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertIn("voice_detection_risk", data)
            self.assertIn("context_detection_risk", data)
            self.assertIn("analysis_mode", data)

if __name__ == "__main__":
    unittest.main()
