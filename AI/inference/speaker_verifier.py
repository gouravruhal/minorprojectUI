"""
Speaker Consistency & Biometric Drift Tracker.
Uses L2-normalized 128-dim forensic embeddings to track caller voiceprint consistency,
exponential moving average (EMA) reference drift, and mid-call voice swapping.
"""
from typing import Optional, Dict, Any
import numpy as np

class SpeakerConsistencyTracker:
    """Biometric voiceprint consistency tracker for real-time call authentication."""

    def __init__(
        self,
        enrolled_embedding: Optional[np.ndarray] = None,
        ema_alpha: float = 0.85,
        drift_threshold: float = 0.35,
        min_enrollment_frames: int = 2
    ):
        self.ema_alpha = ema_alpha
        self.drift_threshold = drift_threshold
        self.min_enrollment_frames = min_enrollment_frames
        self.reference_embedding: Optional[np.ndarray] = None
        self.enrollment_history = []
        self.enrolled = False
        self.total_frames_verified = 0

        if enrolled_embedding is not None:
            self.enroll(enrolled_embedding)

    def _normalize(self, v: np.ndarray) -> np.ndarray:
        norm = np.linalg.norm(v)
        return (v / (norm + 1e-12)).astype(np.float32)

    def enroll(self, embedding: np.ndarray):
        """Explicitly sets or anchors the reference voiceprint."""
        self.reference_embedding = self._normalize(embedding)
        self.enrolled = True

    def update_with_chunk(
        self,
        embedding: np.ndarray,
        spoof_prob: float = 0.0
    ) -> Dict[str, Any]:
        """
        Evaluates a 128-dim embedding against the active caller voiceprint.
        Detects mid-call voice swapping and updates bona fide reference EMA.
        """
        curr = self._normalize(embedding)
        self.total_frames_verified += 1

        # Dynamic enrollment during early bona fide frames (P_spoof < 0.40)
        if not self.enrolled:
            if spoof_prob < 0.40:
                self.enrollment_history.append(curr)
                if len(self.enrollment_history) >= self.min_enrollment_frames:
                    mean_emb = np.mean(self.enrollment_history, axis=0)
                    self.enroll(mean_emb)

            return {
                "cosine_similarity": 1.0,
                "speaker_drift": 0.0,
                "voice_swap_detected": False,
                "enrolled": self.enrolled,
                "verification_status": "ENROLLING" if not self.enrolled else "ENROLLED"
            }

        # Compute cosine similarity: e_current . e_reference (both unit-norm)
        cos_sim = float(np.dot(curr, self.reference_embedding))
        cos_sim = float(np.clip(cos_sim, -1.0, 1.0))
        drift = float(max(0.0, 1.0 - cos_sim))

        # Mid-call voice swap: severe drift beyond threshold
        voice_swap = bool(drift >= self.drift_threshold)

        # If speech is bona fide and consistent, softly adapt reference via EMA
        if spoof_prob < 0.35 and not voice_swap:
            adapted = self.ema_alpha * self.reference_embedding + (1.0 - self.ema_alpha) * curr
            self.reference_embedding = self._normalize(adapted)

        status = "VOICE_SWAP_ALERT" if voice_swap else ("CONSISTENT" if drift < 0.20 else "MODERATE_DRIFT")

        return {
            "cosine_similarity": round(cos_sim, 4),
            "speaker_drift": round(drift, 4),
            "voice_swap_detected": voice_swap,
            "enrolled": True,
            "verification_status": status
        }

