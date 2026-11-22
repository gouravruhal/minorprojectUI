"""
End-to-end verification tests for trained ForensicDetectionModel checkpoint.
Validates model weights loading, EER < 5.0%, and discrimination between
genuine human speech (SAFE risk) and vocoder deepfakes (CRITICAL risk).
"""
import io
import os
import sys
import unittest
import numpy as np
import soundfile as sf
import torch

root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from AI.models.forensic_classifier import ForensicDetectionModel
from backend.app.services.forensic_stream_service import forensic_stream_service
from scripts.train_bootstrap_model import synthesize_acoustic_waveform
from AI.inference.speaker_verifier import verify_against_vip, SpeakerConsistencyTracker

class TestTrainedInference(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ckpt_path = os.path.join(root_dir, "AI", "checkpoints", "forensic_model_trained.pt")
        if not os.path.exists(cls.ckpt_path):
            from scripts.train_bootstrap_model import train_bootstrap_model
            train_bootstrap_model(epochs=6)

    def _waveform_to_wav_bytes(self, waveform: np.ndarray, sr: int = 16000) -> bytes:
        buf = io.BytesIO()
        sf.write(buf, waveform, sr, format="WAV")
        return buf.getvalue()

    def test_checkpoint_file_exists_and_loads(self):
        self.assertTrue(os.path.exists(self.ckpt_path))
        ckpt = torch.load(self.ckpt_path, map_location="cpu")
        self.assertIn("model_state_dict", ckpt)
        model = ForensicDetectionModel(prosody_dim=12, embedding_dim=128)
        model.load_state_dict(ckpt["model_state_dict"])
        self.assertIsNotNone(model)

    def test_validation_eer_below_threshold(self):
        ckpt = torch.load(self.ckpt_path, map_location="cpu")
        val_eer = ckpt.get("best_eer", 100.0)
        self.assertLess(val_eer, 5.0)

    def test_genuine_human_acoustic_inference(self):
        wave_human = synthesize_acoustic_waveform(label=0, seed=777)
        wav_bytes = self._waveform_to_wav_bytes(wave_human)
        report = forensic_stream_service.analyze_full_call(
            contents=wav_bytes, filename="genuine_speaker.wav",
            context={"transaction_sensitivity": "medium"}
        )
        self.assertIn(report["threat_tier"], ("SAFE", "LOW", "GUARDED"))
        self.assertLess(report["risk_score"], 35.0)
        self.assertIn(report["action_recommendation"], ("CONTINUE_MONITORING", "REQUEST_AUTHENTICATION"))
        self.assertFalse(report["speaker_verification"]["voice_swap_detected"])

    def test_synthetic_vocoder_acoustic_inference(self):
        wave_spoof = synthesize_acoustic_waveform(label=1, seed=888)
        wav_bytes = self._waveform_to_wav_bytes(wave_spoof)
        report = forensic_stream_service.analyze_full_call(
            contents=wav_bytes, filename="cloned_vocoder.wav",
            context={"transaction_sensitivity": "high"}
        )
        self.assertIn(report["threat_tier"], ("CRITICAL", "WARN", "ELEVATED"))
        self.assertGreaterEqual(report["risk_score"], 60.0)
        self.assertIn(report["action_recommendation"], ("REQUEST_CALLBACK", "FREEZE_TRANSACTION", "TRIGGER_MFA_CHALLENGE", "TERMINATE_TRANSACTION", "INITIATE_MANUAL_CALLBACK"))

    def test_real_user_microphone_recording_bona_fide(self):
        user_path = os.path.join(root_dir, "AI", "data", "raw", "user_recording_human.m4a")
        if os.path.exists(user_path):
            with open(user_path, "rb") as f:
                raw_bytes = f.read()
            report = forensic_stream_service.analyze_full_call(contents=raw_bytes, filename="user_recording_human.m4a")
            self.assertIn(report["threat_tier"], ("SAFE", "LOW", "GUARDED"))
            self.assertLess(report["risk_score"], 35.0)

    def test_vip_speaker_verification_impersonation(self):
        """Verifies that an unmatching voice claiming to be CEO Rajesh Sharma is flagged as IMPERSONATION_MISMATCH."""
        rng = np.random.RandomState(9999)
        fake_emb = rng.randn(128).astype(np.float32)
        res = verify_against_vip(fake_emb, claimed_vip_id="VIP-001")
        self.assertEqual(res["claimed_vip"], "VIP-001")
        self.assertTrue(res["impersonation_detected"])
        self.assertEqual(res["status"], "IMPERSONATION_MISMATCH")

    def test_speaker_biometric_voiceprint_drift(self):
        tracker = SpeakerConsistencyTracker()
        tracker.enroll(np.random.randn(128))
        res = tracker.update_with_chunk(tracker.reference_embedding)
        self.assertLess(res["speaker_drift"], 0.05)

if __name__ == "__main__":
    unittest.main()
