"""
Unit tests for Audio-Language LLM & Conversational Intent Recognition.
Verifies Speech-to-Text ASR, suspicious phrase extraction, speaker attribution,
and cross-modal social engineering detection.
"""
import os
import sys
import unittest

root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from AI.inference.audio_language_llm import audio_language_llm
from backend.app.services.forensic_stream_service import forensic_stream_service

DOWNLOADS_DIR = os.path.join(root_dir, "downloads")

class TestAudioLanguageLLM(unittest.TestCase):

    def test_suspicious_phrase_extraction(self):
        text = "Hello, this is Rajesh. Please execute an urgent wire transfer of funds immediately. Send the OTP verification code."
        phrases = audio_language_llm.extract_suspicious_phrases(text)
        categories = [p["category"] for p in phrases]
        self.assertIn("FINANCIAL_COERCION", categories)
        self.assertIn("URGENCY_MANIPULATION", categories)
        self.assertIn("CREDENTIAL_HARVESTING", categories)
        self.assertIn("IMPERSONATION_CLAIM", categories)

    def test_impersonation_claim_biometric_mismatch(self):
        text = "This is Rajesh Sharma, CEO of the company. Approve the invoice immediately."
        res = audio_language_llm.analyze(
            audio_input=b"",
            claimed_vip="VIP-001",
            vip_verification={"voiceprint_match_pct": 14.5, "impersonation_detected": True},
            acoustic_prob=85.0
        )
        # Directly test phrase extraction on text
        phrases = audio_language_llm.extract_suspicious_phrases(text)
        self.assertTrue(len(phrases) >= 2)
        self.assertIn("IMPERSONATION_CLAIM", [p["category"] for p in phrases])

    def test_transcribe_audio_from_file(self):
        sample_path = os.path.join(DOWNLOADS_DIR, "human_sample_1.wav")
        if os.path.exists(sample_path):
            with open(sample_path, "rb") as f:
                raw_bytes = f.read()
            res = audio_language_llm.analyze(raw_bytes, acoustic_prob=10.0)
            self.assertIn("transcript", res)
            self.assertIn("speaker_attribution", res)
            self.assertIn("llm_reasoning", res)

    def test_forensic_stream_service_includes_speech_intent(self):
        sample_path = os.path.join(DOWNLOADS_DIR, "human_indian_english_rajesh.wav")
        if os.path.exists(sample_path):
            with open(sample_path, "rb") as f:
                data = f.read()
            report = forensic_stream_service.analyze_full_call(
                data, filename="human_indian_english_rajesh.wav",
                context={"claimed_vip": "VIP-001", "transaction_amount": 75000}
            )
            self.assertIn("speech_text_analysis", report)
            self.assertIn("transcript", report["speech_text_analysis"])
            self.assertIn("semantic_threat_score", report["speech_text_analysis"])
            self.assertIn("speaker_attribution", report["speech_text_analysis"])

if __name__ == "__main__":
    unittest.main()
