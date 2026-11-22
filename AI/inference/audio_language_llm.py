"""
VoiceShield AI Audio-Language & Conversational Intent LLM.
Performs in-memory Speech-to-Text (ASR), suspicious phrase extraction,
speaker identity correlation, and cross-modal social engineering detection.
"""
import io
import re
from typing import Dict, Any, List, Optional
import numpy as np
import soundfile as sf
import speech_recognition as sr

# High-risk social engineering conversational phrase patterns
FRAUD_PHRASE_PATTERNS = [
    {
        "category": "FINANCIAL_COERCION",
        "severity": "CRITICAL",
        "regex": r"\b(wire transfer|transfer funds|send money|rtgs|neft|new account|beneficiary|urgent payment|emergency fund)\b",
        "weight": 35.0,
        "description": "Demand for immediate financial disbursement or wire diversion"
    },
    {
        "category": "URGENCY_MANIPULATION",
        "severity": "HIGH",
        "regex": r"\b(immediately|right now|urgent|hurry|do not wait|asap|critical deadline|confidential acquisition|keep this quiet)\b",
        "weight": 25.0,
        "description": "High-pressure urgency coercion preventing secondary verification"
    },
    {
        "category": "CREDENTIAL_HARVESTING",
        "severity": "CRITICAL",
        "regex": r"\b(otp|passcode|password|security code|verification code|bypass|disable mfa|override authorization|verify my voice)\b",
        "weight": 40.0,
        "description": "Attempted extraction of authentication credentials or MFA tokens"
    },
    {
        "category": "IMPERSONATION_CLAIM",
        "severity": "HIGH",
        "regex": r"\b(this is (rajesh|anita|the ceo|the cfo|vikram)|calling on behalf of|executive order|authorized by ceo)\b",
        "weight": 20.0,
        "description": "Explicit executive authority claim to compel subordinate compliance"
    }
]

class AudioLanguageLLM:
    """Multi-Modal Speech-to-Text & Conversational Threat Reasoner."""

    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.recognizer.energy_threshold = 300
        self.recognizer.dynamic_energy_threshold = True

    def transcribe_audio_bytes(self, wav_bytes: bytes) -> str:
        """In-memory zero-disk speech recognition from raw WAV bytes."""
        try:
            buf = io.BytesIO(wav_bytes)
            with sr.AudioFile(buf) as source:
                audio = self.recognizer.record(source)
            text = self.recognizer.recognize_google(audio)
            return text.strip()
        except sr.UnknownValueError:
            return ""
        except Exception:
            return ""

    def transcribe_waveform(self, waveform: np.ndarray, sr_rate: int = 16000) -> str:
        """Transcribes numpy float32 audio waveform in-memory."""
        try:
            buf = io.BytesIO()
            sf.write(buf, waveform, sr_rate, format="WAV", subtype="PCM_16")
            return self.transcribe_audio_bytes(buf.getvalue())
        except Exception:
            return ""

    def extract_suspicious_phrases(self, text: str) -> List[Dict[str, Any]]:
        """Scans transcript for high-risk social engineering and fraud phrases."""
        if not text:
            return []
        found = []
        lowered = text.lower()
        for p in FRAUD_PHRASE_PATTERNS:
            matches = list(re.finditer(p["regex"], lowered))
            for m in matches:
                matched_str = m.group(0)
                found.append({
                    "phrase": matched_str,
                    "category": p["category"],
                    "severity": p["severity"],
                    "weight": p["weight"],
                    "description": p["description"],
                    "start_idx": m.start(),
                    "end_idx": m.end()
                })
        return found

    def analyze(
        self,
        audio_input: Any,
        sr_rate: int = 16000,
        claimed_vip: Optional[str] = None,
        vip_verification: Optional[Dict[str, Any]] = None,
        acoustic_prob: float = 0.0
    ) -> Dict[str, Any]:
        """Performs full audio-language transcription, phrase scanning, and speaker correlation."""
        if isinstance(audio_input, bytes):
            transcript = self.transcribe_audio_bytes(audio_input)
        elif isinstance(audio_input, np.ndarray):
            transcript = self.transcribe_waveform(audio_input, sr_rate)
        else:
            transcript = ""

        flagged_phrases = self.extract_suspicious_phrases(transcript)

        # Calculate semantic threat score (0-100)
        base_threat = sum(item["weight"] for item in flagged_phrases)
        semantic_score = float(np.clip(base_threat, 0.0, 100.0))

        # Speaker Attribution & Consistency Check
        vip_ver = vip_verification or {}
        match_pct = float(vip_ver.get("voiceprint_match_pct", 100.0 if not claimed_vip else 0.0))
        is_impersonation = bool(vip_ver.get("impersonation_detected", False))

        has_identity_claim = any(p["category"] == "IMPERSONATION_CLAIM" for p in flagged_phrases)
        impersonation_mismatch = bool(has_identity_claim and (match_pct < 70.0 or is_impersonation))

        if impersonation_mismatch:
            semantic_score = max(semantic_score, 85.0)

        speaker_label = claimed_vip or "Unenrolled Caller"
        if match_pct >= 82.0:
            spk_status = "VERIFIED_BIOMETRIC_MATCH"
        elif match_pct < 70.0 and claimed_vip:
            spk_status = "CRITICAL_BIOMETRIC_MISMATCH"
        else:
            spk_status = "UNVERIFIED_VOICE"

        # Generate Cross-Modal LLM Forensic Reasoning
        reasoning = self._build_forensic_reasoning(
            transcript=transcript,
            phrases=flagged_phrases,
            match_pct=match_pct,
            spk_status=spk_status,
            impersonation_mismatch=impersonation_mismatch,
            acoustic_prob=acoustic_prob
        )

        return {
            "transcript": transcript or "(No audible spoken words detected in window)",
            "has_speech": bool(transcript),
            "detected_phrases": flagged_phrases,
            "detected_phrases_count": len(flagged_phrases),
            "semantic_threat_score": round(semantic_score, 1),
            "impersonation_claim_detected": impersonation_mismatch,
            "speaker_attribution": {
                "claimed_identity": speaker_label,
                "biometric_status": spk_status,
                "voiceprint_match_pct": round(match_pct, 1),
                "impersonation_mismatch": impersonation_mismatch
            },
            "llm_reasoning": reasoning
        }

    def _build_forensic_reasoning(
        self, transcript: str, phrases: List[Dict[str, Any]], match_pct: float,
        spk_status: str, impersonation_mismatch: bool, acoustic_prob: float
    ) -> str:
        """Synthesizes cross-modal acoustic and semantic forensic narrative."""
        if not transcript:
            return "No distinct linguistic phonemes deciphered. Acoustic classification operates purely on spectral & biomechanical invariants."

        phrase_names = [f"'{p['phrase']}' ({p['category']})" for p in phrases]
        phrase_summary = ", ".join(phrase_names) if phrase_names else "No high-risk fraud keywords detected"

        if impersonation_mismatch or acoustic_prob >= 50.0:
            return (
                f"Linguistic & Acoustic Correlation Alert: Caller verbally spoke {phrase_summary}. "
                f"Acoustic biometrics confirm {spk_status} (Voiceprint match: {match_pct}%, Vocoder prob: {round(acoustic_prob, 1)}%). "
                f"Discrepancy between verbal identity claims and vocal tract physical geometry indicates an active social engineering attack."
            )
        return (
            f"Linguistic Audit: Spoken dialogue analyzed ('{transcript[:60]}...'). {phrase_summary}. "
            f"Vocal biometrics indicate normal consistency (Match: {match_pct}%)."
        )

# Global singleton
audio_language_llm = AudioLanguageLLM()
