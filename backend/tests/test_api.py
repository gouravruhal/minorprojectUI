"""
Automated unit and integration tests for the VoiceShield backend API and database.
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

from backend.app.main import app
from backend.app.database.db import init_db

class TestVoiceAnalysisAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)

    def test_health_check(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "online")
        self.assertEqual(data["database"], "connected")

    def test_create_session_success(self):
        payload = {"mode": "microphone", "audio_source": "laptop_mic", "user_consent": True}
        res = self.client.post("/api/voice/live/sessions", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["session_id"].startswith("SES-"))

    def test_create_session_without_consent_rejected(self):
        payload = {"mode": "microphone", "user_consent": False}
        res = self.client.post("/api/voice/live/sessions", json=payload)
        self.assertEqual(res.status_code, 400)

    def test_upload_corrupted_file_rejected(self):
        corrupt_bytes = b"not an audio file"
        res = self.client.post(
            "/api/voice/upload",
            files={"file": ("test.wav", io.BytesIO(corrupt_bytes), "audio/wav")},
            data={"consent": "true"}
        )
        self.assertEqual(res.status_code, 400)

    def test_upload_valid_audio_persisted(self):
        t = np.linspace(0, 1.0, 16000)
        samples = (0.4 * np.sin(2 * np.pi * 140 * t)).astype(np.float32)
        bio = io.BytesIO()
        sf.write(bio, samples, 16000, format="WAV")
        bio.seek(0)

        res = self.client.post(
            "/api/voice/upload",
            files={"file": ("synthetic_test.wav", bio, "audio/wav")},
            data={"consent": "true"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("analysis_id", data)
        self.assertIn("label", data)
        self.assertIn("synthetic_probability", data)

        # Verify record was stored in SQLite and can be retrieved
        analysis_id = data["analysis_id"]
        get_res = self.client.get(f"/api/voice/analysis/{analysis_id}")
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.json()["analysis_id"], analysis_id)

    def test_websocket_streaming(self):
        # Create session first
        sess_res = self.client.post("/api/voice/live/sessions", json={"mode": "microphone", "user_consent": True})
        session_id = sess_res.json()["session_id"]

        with self.client.websocket_connect(f"/api/voice/live/{session_id}") as websocket:
            raw_pcm = np.zeros(6400, dtype=np.int16).tobytes() # 400ms PCM
            websocket.send_bytes(raw_pcm)
            data = websocket.receive_json()
            self.assertIn("label", data)
            self.assertIn("confidence", data)

            websocket.send_text('{"action": "stop"}')
            stop_ack = websocket.receive_json()
            self.assertEqual(stop_ack["status"], "stopped")

if __name__ == "__main__":
    unittest.main()
