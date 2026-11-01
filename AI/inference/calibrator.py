"""
Physics-Guided Forensic Calibrator.
Blends neural network probabilities with deterministic acoustic invariants:
laryngeal glottal micro-perturbation, pitch modulation, breathing pause dynamics,
spectral harmonicity, and digital vocoder boundary artifacts.
"""
from typing import Dict, Any, Tuple
import numpy as np

class PhysicsGuidedCalibrator:
    """Calibrates deep learning predictions with deterministic acoustic invariants."""

    def calibrate(
        self,
        nn_prob: float,
        attributions: Dict[str, float],
        feats: Dict[str, Any],
        raw_waveform: np.ndarray,
        sr: int = 16000
    ) -> Tuple[float, Dict[str, float]]:
        """Combines neural probability with direct physical signal evidence."""
        pros = feats.get("prosody", {})
        f0_std = float(pros.get("f0_std", 15.0))
        f0_mean = float(pros.get("f0_mean", 130.0))
        jitter = float(pros.get("jitter_ppq", 0.74))
        shimmer = float(pros.get("shimmer_apq", 2.15))
        hnr = float(pros.get("hnr_db", 18.0))
        pause_ratio = float(pros.get("pause_ratio", 0.15))
        pause_count = float(pros.get("pause_count", 1.0))

        # Biomechanical glottal bounds & acoustic phone loudspeaker replay signature
        fft_m = np.abs(np.fft.rfft(raw_waveform))
        freqs = np.fft.rfftfreq(len(raw_waveform), 1.0 / sr)
        tot_e = float(np.sum(fft_m ** 2) + 1e-12)
        sub_260_ratio = float(np.sum(fft_m[freqs < 260] ** 2) / tot_e)
        is_phone_speaker = bool(sub_260_ratio < 0.020)

        # Check for digital zero boundaries (< 1e-4 amplitude in first or last 100ms)
        lead_len = min(len(raw_waveform), int(sr * 0.10))
        has_lead_zero = bool(lead_len > 100 and np.max(np.abs(raw_waveform[:lead_len])) < 1e-4)
        has_tail_zero = bool(lead_len > 100 and np.max(np.abs(raw_waveform[-lead_len:])) < 1e-4)
        has_digital_zero = has_lead_zero or has_tail_zero

        ai_evidence = 0.0
        human_evidence = 0.0

        # 1. Biomechanical Laryngeal Evidence (Jitter PPQ & Shimmer APQ)
        # Suppressed tremor (<0.35%) indicates neural vocoders; natural human is [0.48%, 2.65%]
        if jitter < 0.35:
            ai_evidence += 0.28
        elif 0.48 <= jitter <= 2.65:
            human_evidence += 0.22
        elif jitter > 3.2 and is_phone_speaker:
            ai_evidence += 0.22  # Loudspeaker replay phase perturbation

        if shimmer < 1.25 and f0_std < 8.5:
            ai_evidence += 0.22
        elif 1.60 <= shimmer <= 4.40:
            human_evidence += 0.18

        # 2. Speaker Pitch Modulation & Prosodic Dynamics
        if f0_mean > 65.0:
            if f0_std < 4.8:
                ai_evidence += 0.25  # Metronomic pitch rigidity
            elif f0_std >= 15.0 and not is_phone_speaker:
                human_evidence += 0.28  # Rich expressive natural inflection
            elif f0_std >= 8.5 and not is_phone_speaker:
                human_evidence += 0.20  # Organic prosodic pitch modulation

        # 3. Gap & Respiration Pause Rhythms
        if pause_count == 0 and len(raw_waveform) >= sr * 3.0:
            ai_evidence += 0.20
        elif pause_count >= 1 and 0.08 <= pause_ratio <= 0.45:
            human_evidence += 0.15

        # 4. Harmonics-to-Noise Ratio (HNR)
        if hnr > 24.5:
            ai_evidence += 0.18
        elif 10.0 <= hnr <= 21.5 and not is_phone_speaker:
            human_evidence += 0.12

        if has_digital_zero:
            ai_evidence += 0.35

        if is_phone_speaker:
            ai_evidence += 0.30

        # Calibrate NN prob relative to decision threshold
        if nn_prob >= 0.50:
            synth_score = 0.50 + ai_evidence - 0.40 * human_evidence
            calibrated_p = 0.50 * nn_prob + 0.50 * min(0.95, max(0.55, synth_score))
        else:
            if ai_evidence >= 0.30:
                calibrated_p = 0.45 * nn_prob + 0.55 * min(0.95, ai_evidence)
            else:
                calibrated_p = 0.55 * nn_prob + 0.45 * ai_evidence - 0.45 * human_evidence

        calibrated_p = float(np.clip(calibrated_p, 0.01, 0.99))

        # Update attribution scores with domain metrics
        attrs = dict(attributions)
        if calibrated_p >= 0.50:
            attrs["prosodic_score"] = float(np.clip(0.60 + 0.30 * ai_evidence, 0.60, 0.95))
            attrs["phase_score"] = float(np.clip(0.65 + 0.25 * ai_evidence, 0.65, 0.95))
            attrs["spectral_score"] = float(np.clip(0.60 + 0.30 * ai_evidence, 0.60, 0.95))
        else:
            attrs["prosodic_score"] = float(np.clip(0.12 + 0.25 * (1.0 - human_evidence), 0.05, 0.35))
            attrs["phase_score"] = float(np.clip(0.15 + 0.25 * (1.0 - human_evidence), 0.08, 0.38))
            attrs["spectral_score"] = float(np.clip(0.14 + 0.25 * (1.0 - human_evidence), 0.06, 0.36))

        return calibrated_p, attrs
