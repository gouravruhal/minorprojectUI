"""
Verification and regression tests for Real-time FastAPI endpoints,
WebSocket streaming, VIP speaker verification, and 4-factor risk engine.
"""
import io, os, sys, unittest
import numpy as np
import soundfile as sf
from fastapi.testclient import TestClient

root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from AI.inference.speaker_verifier import SpeakerConsistencyTracker, verify_against_vip
from backend.app.services.risk_engine import ForensicRiskEngine
from backend.app.services.forensic_stream_service import forensic_stream_service
from backend.app.main import app
from backend.app.database import repository

class TestRealtimeBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.sr = 16000
        t = np.linspace(0, 3.0, 3 * cls.sr)
        cls.audio_data = 0.3 * np.sin(2 * np.pi * 200 * t).astype(np.float32)
        buf = io.BytesIO()
        sf.write(buf, cls.audio_data, cls.sr, format="WAV")
        cls.audio_bytes = buf.getvalue()

    def test_speaker_consistency_and_voice_swap_detection(self):
        tracker = SpeakerConsistencyTracker()
        v_real = np.random.randn(128).astype(np.float32)
        v_real /= np.linalg.norm(v_real)
        tracker.update_with_chunk(v_real, spoof_prob=0.10)
        res2 = tracker.update_with_chunk(v_real, spoof_prob=0.10)
        self.assertTrue(tracker.enrolled)
        self.assertEqual(res2["speaker_drift"], 0.0)

        swap_res = tracker.update_with_chunk(-v_real, spoof_prob=0.85)
        self.assertTrue(swap_res["voice_swap_detected"])
        self.assertEqual(swap_res["verification_status"], "VOICE_SWAP_ALERT")

    def test_context_aware_risk_engine_escalations(self):
        engine = ForensicRiskEngine()
        attrs = {"spectral_score": 0.1, "phase_score": 0.1, "prosodic_score": 0.1}

        safe_ctx = {"transaction_sensitivity": "low", "route_type": "cellular", "known_contact": True}
        safe_risk = engine.compute_risk(spoof_prob=0.10, attributions=attrs, context=safe_ctx)
        self.assertIn(safe_risk["threat_tier"], ("SAFE", "LOW"))
        self.assertEqual(safe_risk["action_recommendation"], "CONTINUE_MONITORING")

        crit_ctx = {
            "transaction_sensitivity": "critical",
            "route_type": "voip",
            "transaction_amount": 100000,
            "unusual_location_or_voip_flag": True
        }
        crit_risk = engine.compute_risk(
            spoof_prob=0.85, attributions=attrs,
            speaker_metrics={"voice_swap_detected": True}, context=crit_ctx
        )
        self.assertEqual(crit_risk["threat_tier"], "CRITICAL")
        self.assertIn(crit_risk["action_recommendation"], ("FREEZE_TRANSACTION", "TERMINATE_TRANSACTION"))
        self.assertGreaterEqual(crit_risk["risk_score"], 70.0)

    def test_rest_analyze_audio_endpoint(self):
        response = self.client.post(
            "/api/v1/analyze-audio",
            files={"file": ("call_sample.wav", self.audio_bytes, "audio/wav")},
            data={"transaction_sensitivity": "high", "route_type": "cellular", "caller_id": "CALL-USER-442"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("analysis_id", data)
        self.assertIn("risk_score", data)
        self.assertIn("threat_tier", data)
        self.assertIn("action_recommendation", data)
        self.assertIn("speaker_verification", data)

    def test_websocket_live_call_streaming(self):
        call_id = "test_call_stream_101"
        with self.client.websocket_connect(f"/ws/live-call/{call_id}") as ws:
            ws.send_text('{"action": "configure", "context": {"transaction_sensitivity": "medium"}}')
            resp = ws.receive_json()
            self.assertEqual(resp.get("status"), "CONFIGURED")
            ws.send_bytes(self.audio_bytes)
            frame = ws.receive_json()
            self.assertEqual(frame.get("call_id"), call_id)
            self.assertIn("risk_score", frame)
            ws.send_text('{"action": "stop"}')

    def test_20s_multi_segment_splice_analysis(self):
        sr = 16000
        t1 = np.linspace(0, 10.0, 10 * sr)
        genuine = (0.35 * np.sin(2 * np.pi * 140 * t1)).astype(np.float32)
        t2 = np.linspace(0, 10.0, 10 * sr)
        spoof = (0.35 * np.sign(np.sin(2 * np.pi * 320 * t2))).astype(np.float32)
        audio_20s = np.concatenate([genuine, spoof])

        buf = io.BytesIO()
        sf.write(buf, audio_20s, sr, format="WAV")
        report = forensic_stream_service.analyze_full_call(buf.getvalue(), filename="splice_20s.wav")
        self.assertEqual(report["duration_sec"], 20.0)
        self.assertEqual(len(report["segments"]), 9)
        self.assertIn(report["final_threat_tier"], ["CRITICAL", "WARN", "ELEVATED", "HIGH"])

    def test_sdk_snippets_and_endpoints(self):
        res_snippets = self.client.get("/api/v1/sdk/snippets")
        self.assertEqual(res_snippets.status_code, 200)
        data = res_snippets.json()
        self.assertEqual(data.get("status"), "success")
        snippets = data.get("snippets", {})
        self.assertIn("python_rest", snippets)
        self.assertIn("python_websocket", snippets)
        self.assertIn("javascript_rest", snippets)
        self.assertIn("curl", snippets)

        res_eps = self.client.get("/api/v1/sdk/endpoints")
        self.assertEqual(res_eps.status_code, 200)
        eps = res_eps.json()
        paths = [e["path"] for e in eps]
        self.assertIn("/api/v1/analyze-audio", paths)
        self.assertIn("/ws/live-call/{call_id}", paths)

    def test_openapi_swagger_docs_available(self):
        res_docs = self.client.get("/docs")
        self.assertEqual(res_docs.status_code, 200)
        res_openapi = self.client.get("/openapi.json")
        self.assertEqual(res_openapi.status_code, 200)
        schema = res_openapi.json()
        self.assertEqual(schema.get("info", {}).get("version"), "2.0.0")
        self.assertIn("Developer SDK & Integration", [t["name"] for t in schema.get("tags", [])])

if __name__ == "__main__":
    unittest.main()
