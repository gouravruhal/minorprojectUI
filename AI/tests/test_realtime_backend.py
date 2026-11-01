"""
Verification and regression tests for Step 6: Real-time FastAPI endpoints,
WebSocket streaming, speaker consistency tracking, and context-aware risk engine.
"""
import io
import os
import sys
import unittest
import numpy as np
import soundfile as sf
from fastapi.testclient import TestClient

root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from AI.inference.speaker_verifier import SpeakerConsistencyTracker
from backend.app.services.risk_engine import ForensicRiskEngine
from backend.app.services.forensic_stream_service import forensic_stream_service
from backend.app.main import app
from backend.app.database import repository

class TestRealtimeBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        # Create 3-second synthetic audio fixture
        cls.sr = 16000
        t = np.linspace(0, 3.0, 3 * cls.sr)
        cls.audio_data = 0.3 * np.sin(2 * np.pi * 200 * t).astype(np.float32)
        buf = io.BytesIO()
        sf.write(buf, cls.audio_data, cls.sr, format="WAV")
        cls.audio_bytes = buf.getvalue()

    def test_speaker_consistency_and_voice_swap_detection(self):
        """Verifies reference embedding enrollment, drift calculation, and voice swap detection."""
        tracker = SpeakerConsistencyTracker()
        v_real = np.random.randn(128).astype(np.float32)
        v_real /= np.linalg.norm(v_real)

        # Early frames: auto-enrollment
        res1 = tracker.update_with_chunk(v_real, spoof_prob=0.10)
        res2 = tracker.update_with_chunk(v_real, spoof_prob=0.10)
        self.assertTrue(tracker.enrolled)
        self.assertEqual(res2["speaker_drift"], 0.0)
        self.assertFalse(res2["voice_swap_detected"])

        # Mid-call swap: orthogonal / inverted voiceprint
        v_intruder = -v_real
        swap_res = tracker.update_with_chunk(v_intruder, spoof_prob=0.85)
        self.assertTrue(swap_res["voice_swap_detected"])
        self.assertGreaterEqual(swap_res["speaker_drift"], 0.35)
        self.assertEqual(swap_res["verification_status"], "VOICE_SWAP_ALERT")

    def test_context_aware_risk_engine_escalations(self):
        """Verifies contextual multipliers and sensitivity escalation."""
        engine = ForensicRiskEngine()
        attrs = {"spectral_score": 0.1, "phase_score": 0.1, "prosodic_score": 0.1}

        # Safe scenario
        safe_ctx = {"transaction_sensitivity": "low", "caller_trust_level": "trusted"}
        safe_risk = engine.compute_risk(spoof_prob=0.10, attributions=attrs, context=safe_ctx)
        self.assertEqual(safe_risk["threat_tier"], "LOW")
        self.assertEqual(safe_risk["action_recommendation"], "CONTINUE_MONITORING")

        # Critical scenario (wire transfer + suspicious + VoIP + voice swap)
        crit_ctx = {
            "transaction_sensitivity": "critical",
            "caller_trust_level": "suspicious",
            "unusual_location_or_voip_flag": True
        }
        crit_risk = engine.compute_risk(
            spoof_prob=0.85, attributions=attrs,
            speaker_drift=0.50, voice_swap_detected=True, context=crit_ctx
        )
        self.assertEqual(crit_risk["threat_tier"], "CRITICAL")
        self.assertEqual(crit_risk["action_recommendation"], "TERMINATE_TRANSACTION")
        self.assertGreaterEqual(crit_risk["risk_score"], 75.0)

    def test_rest_analyze_audio_endpoint(self):
        """Tests POST /api/v1/analyze-audio complete end-to-end pipeline and persistence."""
        response = self.client.post(
            "/api/v1/analyze-audio",
            files={"file": ("call_sample.wav", self.audio_bytes, "audio/wav")},
            data={
                "transaction_sensitivity": "high",
                "caller_trust_level": "standard",
                "unusual_location_or_voip_flag": "false",
                "caller_id": "CALL-USER-442"
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("analysis_id", data)
        self.assertIn("risk_score", data)
        self.assertIn("threat_tier", data)
        self.assertIn("action_recommendation", data)
        self.assertIn("latency_ms", data)
        self.assertIn("speaker_verification", data)
        self.assertIn("attributions", data)

        # Verify SQLite record was stored
        record = repository.get_analysis(data["analysis_id"])
        self.assertIsNotNone(record)

    def test_websocket_live_call_streaming(self):
        """Tests WS /ws/live-call/{call_id} chunk streaming and response frames."""
        call_id = "test_call_stream_101"
        with self.client.websocket_connect(f"/ws/live-call/{call_id}") as ws:
            # Send initial configuration text frame
            ws.send_text('{"action": "configure", "context": {"transaction_sensitivity": "medium"}}')
            resp = ws.receive_json()
            self.assertEqual(resp.get("status"), "CONFIGURED")

            # Stream audio bytes chunks
            ws.send_bytes(self.audio_bytes)
            frame = ws.receive_json()
            self.assertEqual(frame.get("call_id"), call_id)
            self.assertIn("risk_score", frame)
            self.assertIn("threat_tier", frame)
            self.assertIn("action", frame)

            # Clean exit
            ws.send_text('{"action": "stop"}')

    def test_20s_multi_segment_splice_analysis(self):
        """Verifies 20.0s multi-segment audio yielding 9 blocks and transition escalation."""
        sr = 16000
        t1 = np.linspace(0, 10.0, 10 * sr)
        genuine_part = (0.35 * np.sin(2 * np.pi * 140 * t1) + 0.15 * np.sin(2 * np.pi * 280 * t1)).astype(np.float32)
        t2 = np.linspace(0, 10.0, 10 * sr)
        spoof_part = (0.35 * np.sign(np.sin(2 * np.pi * 320 * t2)) + 0.20 * np.sin(2 * np.pi * 6400 * t2)).astype(np.float32)
        audio_20s = np.concatenate([genuine_part, spoof_part])
        self.assertEqual(len(audio_20s), 320000)

        buf = io.BytesIO()
        sf.write(buf, audio_20s, sr, format="WAV")
        wav_bytes = buf.getvalue()

        report = forensic_stream_service.analyze_full_call(
            wav_bytes, filename="splice_20s.wav",
            context={"transaction_sensitivity": "high"}
        )

        self.assertEqual(report["duration_sec"], 20.0)
        self.assertEqual(report["segments_count"], 9)
        self.assertEqual(len(report["segments"]), 9)

        expected_ranges = [
            (0.0, 4.0), (2.0, 6.0), (4.0, 8.0), (6.0, 10.0), (8.0, 12.0),
            (10.0, 14.0), (12.0, 16.0), (14.0, 18.0), (16.0, 20.0)
        ]
        for idx, (exp_s, exp_e) in enumerate(expected_ranges):
            seg = report["segments"][idx]
            self.assertEqual(seg["segment_index"], idx)
            self.assertAlmostEqual(seg["start_sec"], exp_s, places=1)
            self.assertAlmostEqual(seg["end_sec"], exp_e, places=1)
            self.assertIn("spoof_prob", seg)
            self.assertIn("risk_score", seg)

        self.assertIn(report["final_threat_tier"], ["CRITICAL", "HIGH", "ELEVATED"])
        self.assertGreaterEqual(report["final_risk_score"], 30.0)
        self.assertIsNotNone(report["peak_segment"])

if __name__ == "__main__":
    unittest.main()

