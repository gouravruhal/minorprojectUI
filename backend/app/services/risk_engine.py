"""
Dynamic Context-Aware Impersonation Risk Engine.
Calculates continuous multi-factor risk scores (0-100), exponential temporal smoothing,
contextual risk escalations, and automated security response recommendations.
"""
from typing import Dict, Any, Optional
import numpy as np

class ForensicRiskEngine:
    """Enterprise risk scoring engine with contextual escalation and temporal smoothing."""

    def __init__(self, ema_beta: float = 0.70):
        self.ema_beta = ema_beta
        self.smoothed_risk: Optional[float] = None
        self.sensitivity_multipliers = {
            "low": 0.85,
            "medium": 1.00,
            "high": 1.20,
            "critical": 1.40
        }
        self.trust_multipliers = {
            "trusted": 0.80,
            "standard": 1.00,
            "suspicious": 1.25
        }

    def compute_risk(
        self,
        spoof_prob: float,
        attributions: Dict[str, float],
        speaker_drift: float = 0.0,
        voice_swap_detected: bool = False,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculates composite risk score R_total in [0, 100] incorporating
        acoustic model probability, pillar attributions, biometric drift, and call metadata.
        """
        ctx = context or {}
        sensitivity = str(ctx.get("transaction_sensitivity", "medium")).lower()
        trust = str(ctx.get("caller_trust_level", "standard")).lower()
        voip_flag = bool(ctx.get("unusual_location_or_voip_flag", False))

        m_sens = self.sensitivity_multipliers.get(sensitivity, 1.00)
        m_trust = self.trust_multipliers.get(trust, 1.00)

        # 1. Acoustic Component (0-100)
        p_spoof_pct = float(spoof_prob * 100.0) if spoof_prob <= 1.0 else float(spoof_prob)

        # 2. Pillar Decomposition
        spec_pct = float(attributions.get("spectral_score", spoof_prob) * 100.0)
        phase_pct = float(attributions.get("phase_score", spoof_prob) * 100.0)
        pros_pct = float(attributions.get("prosodic_score", spoof_prob) * 100.0)
        pillar_mean = (spec_pct + phase_pct + pros_pct) / 3.0

        # 3. Biometric Drift Component (0-100)
        drift_penalty = min(100.0, float(speaker_drift * 100.0 * 2.0))
        if voice_swap_detected:
            drift_penalty = max(80.0, drift_penalty)

        # 4. Raw Composite Risk (allocates dynamically based on whether biometric drift is active)
        if drift_penalty > 0.0 or voice_swap_detected:
            raw_risk = 0.45 * p_spoof_pct + 0.25 * pillar_mean + 0.30 * drift_penalty
        else:
            raw_risk = 0.65 * p_spoof_pct + 0.35 * pillar_mean

        # 5. Contextual Adjustments
        adjusted_risk = raw_risk * m_sens * m_trust
        if voip_flag:
            adjusted_risk += 10.0
        adjusted_risk = float(np.clip(adjusted_risk, 0.0, 100.0))

        # 6. Temporal Exponential Smoothing
        if self.smoothed_risk is None or voice_swap_detected:
            self.smoothed_risk = adjusted_risk
        else:
            # Immediate escalation on severe threats; smooth minor fluctuations
            if adjusted_risk >= 80.0:
                self.smoothed_risk = 0.40 * self.smoothed_risk + 0.60 * adjusted_risk
            else:
                self.smoothed_risk = self.ema_beta * self.smoothed_risk + (1.0 - self.ema_beta) * adjusted_risk

        r_total = round(float(self.smoothed_risk), 1)

        # 7. Threat Tier & Action Recommendation
        if r_total >= 75.0 or voice_swap_detected:
            tier = "CRITICAL"
            rec = "TERMINATE_TRANSACTION" if sensitivity in ("high", "critical") else "INITIATE_MANUAL_CALLBACK"
        elif r_total >= 55.0:
            tier = "ELEVATED"
            rec = "TRIGGER_MFA_CHALLENGE"
        elif r_total >= 30.0:
            tier = "GUARDED"
            rec = "REQUEST_AUTHENTICATION"
        else:
            tier = "LOW"
            rec = "CONTINUE_MONITORING"

        return {
            "risk_score": r_total,
            "raw_risk": round(raw_risk, 1),
            "threat_tier": tier,
            "action_recommendation": rec,
            "components": {
                "acoustic_spoof_prob": round(p_spoof_pct, 1),
                "spectral_anomaly": round(spec_pct, 1),
                "phase_discontinuity": round(phase_pct, 1),
                "prosodic_unnaturalness": round(pros_pct, 1),
                "biometric_drift_penalty": round(drift_penalty, 1)
            },
            "context_factors": {
                "sensitivity_multiplier": m_sens,
                "trust_multiplier": m_trust,
                "voip_flag_applied": voip_flag
            }
        }
