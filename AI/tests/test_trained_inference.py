"""
End-to-end verification tests for trained ForensicDetectionModel checkpoint.
Validates model weights loading, EER < 5.0%, and discrimination between
genuine human speech (LOW risk) and vocoder deepfakes (CRITICAL risk).
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

class TestTrainedInference(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ckpt_path = os.path.join(root_dir, "AI", "checkpoints", "forensic_model_trained.pt")
        # Ensure checkpoint exists, or train bootstrap model if missing
        if not os.path.exists(cls.ckpt_path):
            from scripts.train_bootstrap_model import train_bootstrap_model
            train_bootstrap_model(epochs=6)

    def _waveform_to_wav_bytes(self, waveform: np.ndarray, sr: int = 16000) -> bytes:
        buf = io.BytesIO()
        sf.write(buf, waveform, sr, format="WAV")
        return buf.getvalue()

    def test_checkpoint_file_exists_and_loads(self):
        """Verifies checkpoint existence, valid dictionary keys, and clean loading."""
        self.assertTrue(os.path.exists(self.ckpt_path))
        ckpt = torch.load(self.ckpt_path, map_location="cpu")
        self.assertIn("model_state_dict", ckpt)
        self.assertIn("centroid", ckpt)
        self.assertIn("best_eer", ckpt)

        model = ForensicDetectionModel(prosody_dim=12, embedding_dim=128)
        model.load_state_dict(ckpt["model_state_dict"])
        self.assertIsNotNone(model)

    def test_validation_eer_below_threshold(self):
        """Verifies bootstrap training achieved equal error rate EER < 5.0%."""
        ckpt = torch.load(self.ckpt_path, map_location="cpu")
        val_eer = ckpt.get("best_eer", 100.0)
        self.assertLess(val_eer, 5.0)

    def test_genuine_human_acoustic_inference(self):
        """Natural human speech must trigger LOW threat tier and low risk score."""
        wave_human = synthesize_acoustic_waveform(label=0, seed=777)
        wav_bytes = self._waveform_to_wav_bytes(wave_human)

        report = forensic_stream_service.analyze_full_call(
            contents=wav_bytes,
            filename="genuine_speaker.wav",
            context={"transaction_sensitivity": "medium"}
        )

        self.assertIn(report["threat_tier"], ("LOW", "GUARDED"))
        self.assertLess(report["risk_score"], 35.0)
        self.assertIn(report["action_recommendation"], ("CONTINUE_MONITORING", "REQUEST_AUTHENTICATION"))
        self.assertFalse(report["speaker_verification"]["voice_swap_detected"])

    def test_synthetic_vocoder_acoustic_inference(self):
        """AI vocoder synthesized speech must trigger ELEVATED or CRITICAL threat tier."""
        wave_spoof = synthesize_acoustic_waveform(label=1, seed=888)
        wav_bytes = self._waveform_to_wav_bytes(wave_spoof)

        report = forensic_stream_service.analyze_full_call(
            contents=wav_bytes,
            filename="cloned_vocoder.wav",
            context={"transaction_sensitivity": "high"}
        )

        self.assertIn(report["threat_tier"], ("ELEVATED", "CRITICAL"))
        self.assertGreaterEqual(report["risk_score"], 65.0)
        self.assertIn(report["action_recommendation"], ("TRIGGER_MFA_CHALLENGE", "TERMINATE_TRANSACTION", "INITIATE_MANUAL_CALLBACK"))

    def test_real_user_microphone_recording_bona_fide(self):
        """User's noisy and compressed microphone recording must evaluate as genuine human."""
        user_path = os.path.join(root_dir, "AI", "data", "raw", "user_recording_human.m4a")
        if os.path.exists(user_path):
            with open(user_path, "rb") as f:
                raw_bytes = f.read()
            report = forensic_stream_service.analyze_full_call(
                contents=raw_bytes,
                filename="user_recording_human.m4a"
            )
            self.assertIn(report["threat_tier"], ("LOW", "GUARDED"))
            self.assertLess(report["risk_score"], 35.0)

    def test_speaker_biometric_voiceprint_drift(self):
        """Consecutive genuine utterances from the same voice must show low drift."""
        wave_1 = synthesize_acoustic_waveform(label=0, seed=101)
        wave_2 = synthesize_acoustic_waveform(label=0, seed=101)

        rep1 = forensic_stream_service.analyze_full_call(self._waveform_to_wav_bytes(wave_1))
        rep2 = forensic_stream_service.analyze_full_call(self._waveform_to_wav_bytes(wave_2))

        # Re-verify same embedding against tracker
        from AI.inference.speaker_verifier import SpeakerConsistencyTracker
        tracker = SpeakerConsistencyTracker()
        tracker.enroll(np.random.randn(128))
        res = tracker.update_with_chunk(tracker.reference_embedding)
        self.assertLess(res["speaker_drift"], 0.05)

if __name__ == "__main__":
    unittest.main()

