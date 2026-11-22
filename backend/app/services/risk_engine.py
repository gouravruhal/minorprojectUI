"""
Dynamic Context-Aware Impersonation Risk Engine.
Calculates 4-factor weighted risk (0-100):
Model (50%) + Prosody (20%) + Speaker Match (15%) + Call Context (15%).
Threshold triggers: 0-39 (Safe), 40-69 (Warn), 70+ (Critical: Freeze/MFA).
"""
from typing import Dict, Any, Optional
import numpy as np

class ForensicRiskEngine:
    """Enterprise risk scoring engine combining deep learning, DSP prosody, biometrics, and call context."""

    def __init__(self, ema_beta: float = 0.70):
        self.ema_beta = ema_beta
        self.smoothed_risk: Optional[float] = None

    def compute_risk(
        self,
        spoof_prob: float,
        attributions: Optional[Dict[str, float]] = None,
        dsp_features: Optional[Dict[str, float]] = None,
        speaker_metrics: Optional[Dict[str, Any]] = None,
        speaker_drift: Optional[float] = None,
        voice_swap_detected: Optional[bool] = None,
        context: Optional[Dict[str, Any]] = None,
        speech_analysis: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Calculates 4-factor composite risk score R in [0, 100]."""
        attrs = attributions or {}
        dsp = dsp_features or {}
        spk = dict(speaker_metrics or {})
        ctx = context or {}
        sp_llm = speech_analysis or {}

        if speaker_drift is not None:
            spk["speaker_drift"] = speaker_drift
        if voice_swap_detected is not None:
            spk["voice_swap_detected"] = voice_swap_detected

        # 1. Model Score (50% weight): deep neural probability in [0, 100]
        p_raw = float(spoof_prob * 100.0) if spoof_prob <= 1.0 else float(spoof_prob)
        s_model = float(np.clip(p_raw, 0.0, 100.0))

        # 2. Prosody Anomaly (20% weight): neural attribution + glottal micro-perturbations
        pros_val = attrs.get("prosodic_score", attrs.get("prosodic_unnaturalness"))
        pros_attr = float(pros_val * 100.0) if pros_val is not None else p_raw
        f0_std = float(dsp.get("f0_std", dsp.get("pitch_stability_std", 20.0)))
        jitter = float(dsp.get("jitter_ppq", 0.35))
        shimmer = float(dsp.get("shimmer_apq", 2.5))
        pause_ratio = float(dsp.get("pause_ratio", 0.20))

        pros_penalty = 0.0
        if f0_std < 8.5:
            pros_penalty += 20.0
        elif f0_std >= 16.0 and p_raw < 50.0:
            pros_penalty -= 10.0

        if jitter < 0.12 or shimmer < 1.10:
            pros_penalty += 15.0
        if pause_ratio > 0.45 or pause_ratio < 0.04:
            pros_penalty += 10.0

        s_prosody = float(np.clip(pros_attr + pros_penalty, 0.0, 100.0))

        # 3. Speaker Match / Biometric Impersonation (15% weight)
        is_swap = bool(spk.get("voice_swap_detected", False))
        is_impersonation = bool(spk.get("impersonation_detected", False))
        match_pct = float(spk.get("voiceprint_match_pct", 100.0 if not is_impersonation else 15.0))
        drift = float(spk.get("speaker_drift", 0.04))

        if is_swap or is_impersonation:
            s_speaker = 100.0
        elif spk.get("claimed_vip"):
            s_speaker = max(0.0, 100.0 - match_pct) if match_pct < 70.0 else max(0.0, (100.0 - match_pct) * 0.25)
        else:
            s_speaker = float(np.clip(drift * 50.0, 0.0, 100.0))

        # 4. Call Context (15% weight): Route, Transaction Amount, Contact Status
        ctx_risk = 0.0
        route = str(ctx.get("route_type", "cellular")).lower()
        if route in ("voip", "unknown", "spoofed") or bool(ctx.get("unusual_location_or_voip_flag", False)):
            ctx_risk += 35.0

        tx_amount = float(ctx.get("transaction_amount", 0.0))
        if tx_amount > 500000:
            ctx_risk += 50.0
        elif tx_amount > 50000:
            ctx_risk += 35.0

        if not bool(ctx.get("known_contact", True)):
            ctx_risk += 20.0

        sens = str(ctx.get("transaction_sensitivity", "medium")).lower()
        if sens in ("high", "critical"):
            ctx_risk += 15.0

        sem_threat = float(sp_llm.get("semantic_threat_score", 0.0))
        if sem_threat > 0.0:
            ctx_risk += sem_threat * 0.40
        if sp_llm.get("impersonation_claim_detected", False):
            ctx_risk += 35.0
            is_impersonation = True

        s_context = float(np.clip(ctx_risk, 0.0, 100.0))

        # Weighted Composite (0-100)
        raw_composite = (0.50 * s_model) + (0.20 * s_prosody) + (0.15 * s_speaker) + (0.15 * s_context)
        if is_swap or is_impersonation:
            raw_composite = max(raw_composite, 75.0)
        raw_composite = float(np.clip(raw_composite, 0.0, 100.0))

        # Temporal Exponential Smoothing
        if self.smoothed_risk is None or is_swap or is_impersonation:
            self.smoothed_risk = raw_composite
        else:
            if raw_composite >= 70.0:
                self.smoothed_risk = 0.35 * self.smoothed_risk + 0.65 * raw_composite
            else:
                self.smoothed_risk = self.ema_beta * self.smoothed_risk + (1.0 - self.ema_beta) * raw_composite

        r_total = round(float(self.smoothed_risk), 1)

        # Threshold Triggers: 0-39 (Safe), 40-69 (Warn), 70+ (Critical)
        if r_total >= 70.0 or is_swap or is_impersonation:
            tier = "CRITICAL"
            rec = "FREEZE_TRANSACTION"
        elif r_total >= 40.0:
            tier = "WARN"
            rec = "REQUEST_CALLBACK"
        else:
            tier = "SAFE"
            rec = "CONTINUE_MONITORING"

        return {
            "risk_score": r_total,
            "threat_tier": tier,
            "action_recommendation": rec,
            "risk_breakdown": {
                "model_score": round(s_model, 1),
                "prosody_score": round(s_prosody, 1),
                "speaker_score": round(s_speaker, 1),
                "context_score": round(s_context, 1),
                "weighted_contributions": {
                    "model": round(0.50 * s_model, 1),
                    "prosody": round(0.20 * s_prosody, 1),
                    "speaker": round(0.15 * s_speaker, 1),
                    "context": round(0.15 * s_context, 1)
                }
            },
            "context_factors": {
                "route_type": route,
                "transaction_amount": tx_amount,
                "amount_flagged": bool(tx_amount > 50000),
                "known_contact": bool(ctx.get("known_contact", True)),
                "sensitivity": sens
            }
        }
