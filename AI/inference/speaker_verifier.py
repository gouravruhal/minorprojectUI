"""
Speaker Consistency & VIP Voiceprint Verification Engine.
Compares live 128-dim embeddings against enrolled VIP profiles (CEO, CFO, VP)
and tracks within-call biometric drift and mid-call voice swapping.
"""
from typing import Optional, Dict, Any, List
import numpy as np

def _create_deterministic_embedding(seed: int, dim: int = 128) -> np.ndarray:
    rng = np.random.RandomState(seed)
    v = rng.randn(dim).astype(np.float32)
    return (v / (np.linalg.norm(v) + 1e-12)).astype(np.float32)

VIP_PROFILES: Dict[str, Dict[str, Any]] = {
    "VIP-001": {
        "id": "VIP-001",
        "name": "Rajesh Sharma",
        "role": "Chief Executive Officer (CEO)",
        "department": "Executive Leadership",
        "embedding": _create_deterministic_embedding(1001)
    },
    "VIP-002": {
        "id": "VIP-002",
        "name": "Anita Roy",
        "role": "Chief Financial Officer (CFO)",
        "department": "Treasury & Finance",
        "embedding": _create_deterministic_embedding(2002)
    },
    "VIP-003": {
        "id": "VIP-003",
        "name": "Vikram Malhotra",
        "role": "VP Treasury & Wire Operations",
        "department": "Global Banking",
        "embedding": _create_deterministic_embedding(3003)
    }
}

def get_enrolled_vip_catalog() -> List[Dict[str, str]]:
    """Returns metadata catalog of enrolled VIP voiceprints without exposing embeddings."""
    return [
        {"id": v["id"], "name": v["name"], "role": v["role"], "department": v["department"]}
        for v in VIP_PROFILES.values()
    ]

def verify_against_vip(embedding: np.ndarray, claimed_vip_id: Optional[str] = None) -> Dict[str, Any]:
    """Evaluates 128-dim live embedding against enrolled VIP voiceprint bank."""
    norm = np.linalg.norm(embedding)
    curr = (embedding / (norm + 1e-12)).astype(np.float32)

    if not claimed_vip_id or claimed_vip_id.upper() in ("NONE", "ANONYMOUS", "UNENROLLED"):
        return {
            "claimed_vip": None,
            "voiceprint_match_pct": 100.0,
            "impersonation_detected": False,
            "status": "ANONYMOUS_CALLER"
        }

    target = VIP_PROFILES.get(claimed_vip_id)
    if not target:
        for p in VIP_PROFILES.values():
            if claimed_vip_id.lower() in p["name"].lower() or claimed_vip_id.lower() in p["role"].lower():
                target = p
                break

    if not target:
        return {
            "claimed_vip": claimed_vip_id,
            "voiceprint_match_pct": 50.0,
            "impersonation_detected": False,
            "status": "PROFILE_NOT_FOUND"
        }

    cos_sim = float(np.dot(curr, target["embedding"]))
    match_pct = round(float(np.clip((cos_sim + 1.0) / 2.0 * 100.0, 0.0, 100.0)), 1)
    is_impersonation = bool(match_pct < 68.0)
    status = "VERIFIED_VIP" if not is_impersonation else "IMPERSONATION_MISMATCH"

    return {
        "claimed_vip": target["id"],
        "claimed_name": target["name"],
        "claimed_role": target["role"],
        "voiceprint_match_pct": match_pct,
        "impersonation_detected": is_impersonation,
        "status": status
    }

class SpeakerConsistencyTracker:
    """Biometric voiceprint consistency tracker for real-time call authentication."""

    def __init__(self, ema_alpha: float = 0.85, drift_threshold: float = 0.35):
        self.ema_alpha = ema_alpha
        self.drift_threshold = drift_threshold
        self.reference_embedding: Optional[np.ndarray] = None
        self.enrolled = False
        self.total_frames_verified = 0

    def _normalize(self, v: np.ndarray) -> np.ndarray:
        norm = np.linalg.norm(v)
        return (v / (norm + 1e-12)).astype(np.float32)

    def enroll(self, embedding: np.ndarray):
        self.reference_embedding = self._normalize(embedding)
        self.enrolled = True

    def update_with_chunk(self, embedding: np.ndarray, spoof_prob: float = 0.0) -> Dict[str, Any]:
        curr = self._normalize(embedding)
        self.total_frames_verified += 1

        if not self.enrolled:
            if spoof_prob < 0.40:
                self.enroll(curr)
            return {
                "cosine_similarity": 1.0, "speaker_drift": 0.0,
                "voice_swap_detected": False, "enrolled": self.enrolled,
                "verification_status": "ENROLLED" if self.enrolled else "ENROLLING"
            }

        cos_sim = float(np.clip(np.dot(curr, self.reference_embedding), -1.0, 1.0))
        drift = float(max(0.0, 1.0 - cos_sim))
        voice_swap = bool(drift >= self.drift_threshold)

        if spoof_prob < 0.35 and not voice_swap:
            adapted = self.ema_alpha * self.reference_embedding + (1.0 - self.ema_alpha) * curr
            self.reference_embedding = self._normalize(adapted)

        status = "VOICE_SWAP_ALERT" if voice_swap else ("CONSISTENT" if drift < 0.20 else "MODERATE_DRIFT")
        return {
            "cosine_similarity": round(cos_sim, 4), "speaker_drift": round(drift, 4),
            "voice_swap_detected": voice_swap, "enrolled": True, "verification_status": status
        }
