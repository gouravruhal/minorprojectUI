"""
Multilingual Robustness Unit Test Suite.
Verifies that language-agnostic spectral features and physical laryngeal DSP
correctly discriminate Bona Fide Human vs. Synthetic AI Clones across
Indian-accented English and Hindi speech without phoneme-level degradation.
"""
import os
import sys
import unittest
import numpy as np

root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from backend.app.services.forensic_stream_service import forensic_stream_service

DOWNLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "downloads")

class MultilingualRobustnessTests(unittest.TestCase):

    def test_indian_accented_english_bona_fide_safe(self):
        path = os.path.join(DOWNLOADS_DIR, "human_indian_english_rajesh.wav")
        self.assertTrue(os.path.exists(path), "Sample file missing")
        with open(path, "rb") as f:
            data = f.read()
        rep = forensic_stream_service.analyze_full_call(data, filename="human_indian_english_rajesh.wav")
        self.assertLess(rep["final_risk_score"], 40.0)
        self.assertEqual(rep["final_threat_tier"], "SAFE")
        self.assertEqual(rep["action_recommendation"], "CONTINUE_MONITORING")

    def test_indian_accented_english_ai_clone_detected(self):
        path = os.path.join(DOWNLOADS_DIR, "ai_indian_english_clone.wav")
        self.assertTrue(os.path.exists(path), "Sample file missing")
        with open(path, "rb") as f:
            data = f.read()
        rep = forensic_stream_service.analyze_full_call(data, filename="ai_indian_english_clone.wav")
        self.assertGreaterEqual(rep["final_risk_score"], 40.0)
        self.assertIn(rep["final_threat_tier"], ["WARN", "CRITICAL"])
        self.assertIn(rep["action_recommendation"], ["REQUEST_CALLBACK", "TRIGGER_MFA_CHALLENGE", "FREEZE_TRANSACTION"])

    def test_hindi_speech_bona_fide_safe(self):
        path = os.path.join(DOWNLOADS_DIR, "human_hindi_anita.wav")
        self.assertTrue(os.path.exists(path), "Sample file missing")
        with open(path, "rb") as f:
            data = f.read()
        rep = forensic_stream_service.analyze_full_call(data, filename="human_hindi_anita.wav")
        self.assertLess(rep["final_risk_score"], 40.0)
        self.assertEqual(rep["final_threat_tier"], "SAFE")
        self.assertEqual(rep["action_recommendation"], "CONTINUE_MONITORING")

    def test_hindi_speech_ai_clone_escalation_with_vip_context(self):
        path = os.path.join(DOWNLOADS_DIR, "ai_hindi_vocoder_clone.wav")
        self.assertTrue(os.path.exists(path), "Sample file missing")
        with open(path, "rb") as f:
            data = f.read()
        context = {
            "claimed_vip": "VIP-002",  # Anita Roy (CFO)
            "transaction_amount": 95000,
            "route_type": "voip"
        }
        rep = forensic_stream_service.analyze_full_call(data, filename="ai_hindi_vocoder_clone.wav", context=context)
        self.assertGreaterEqual(rep["final_risk_score"], 70.0)
        self.assertEqual(rep["final_threat_tier"], "CRITICAL")
        self.assertEqual(rep["action_recommendation"], "FREEZE_TRANSACTION")

if __name__ == "__main__":
    unittest.main()
