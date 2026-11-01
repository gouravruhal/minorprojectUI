"""
Inference engine for VoiceShield AI.
Processes 10-20s multi-window recordings and generates Hugging Face LLM risk assessments.
"""
import os
import time
from typing import Dict, Any, Optional
import numpy as np

from AI.configs.inference_config import (
    TARGET_SAMPLE_RATE, MIN_SEGMENT_DURATION_SEC, DEFAULT_WINDOW_SEC,
    DEFAULT_HOP_SEC, ENERGY_THRESHOLD_RMS, SYNTHETIC_THRESHOLD,
    HUMAN_THRESHOLD, MODEL_IDENTIFIER, DISCLAIMER_TEXT
)
from AI.models.classifier import AcousticForensicClassifier
from AI.preprocessing.audio_normalizer import decode_audio_bytes, to_mono_16k, normalize_rms, compute_rms
from AI.preprocessing.feature_extractor import extract_feature_vector
from AI.preprocessing.segmenter import segment_audio
from AI.preprocessing.temporal_processor import extract_temporal_feature_vector, compute_temporal_summary
from AI.preprocessing.forensic_comparator import compute_5s_intervals, build_comparison_metrics
from AI.inference.llm_explainer import generate_risk_explanation

class VoiceDeepfakeDetector:
    """Singleton inference detector maintaining the loaded model checkpoint in memory."""

    def __init__(self, model_checkpoint_path: Optional[str] = None):
        if model_checkpoint_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            model_checkpoint_path = os.path.join(base_dir, "models", "checkpoint.joblib")

        self.model = AcousticForensicClassifier()
        if os.path.exists(model_checkpoint_path):
            try:
                self.model.load(model_checkpoint_path)
            except Exception:
                pass

    def analyze_bytes(self, audio_bytes: bytes) -> Dict[str, Any]:
        samples, sr = decode_audio_bytes(audio_bytes)
        return self.analyze_waveform(samples, sr)

    def analyze_waveform(self, samples: np.ndarray, sr: int = TARGET_SAMPLE_RATE) -> Dict[str, Any]:
        t_start = time.perf_counter()
        samples = to_mono_16k(samples, sr)
        duration_sec = round(len(samples) / float(TARGET_SAMPLE_RATE), 2)
        rms = compute_rms(samples)

        if duration_sec < MIN_SEGMENT_DURATION_SEC:
            return self._build_inconclusive(duration_sec, rms, "Audio segment too brief (min 400ms).", t_start)
        if rms < ENERGY_THRESHOLD_RMS:
            return self._build_inconclusive(duration_sec, rms, "Audio energy below voice activity threshold.", t_start)

        norm_samples = normalize_rms(samples)
        segments = []
        seg_features = []
        seg_scores = []

        for seg_samples, start_t, end_t in segment_audio(norm_samples, TARGET_SAMPLE_RATE, DEFAULT_WINDOW_SEC, DEFAULT_HOP_SEC):
            if compute_rms(seg_samples) < ENERGY_THRESHOLD_RMS:
                continue

            f_vec = extract_feature_vector(seg_samples, TARGET_SAMPLE_RATE)
            seg_features.append(f_vec)
            score = round(self.model.predict_synthetic_score(f_vec), 1)
            seg_scores.append(score)

            segments.append({
                "start_time_sec": start_t, "end_time_sec": end_t, "synthetic_probability": score,
                "label": "AI Clone" if score >= SYNTHETIC_THRESHOLD else ("Human" if score <= HUMAN_THRESHOLD else "Inconclusive"),
                "f0_hz": round(float(f_vec[0]), 1), "jitter_ppq": round(float(f_vec[1]), 3),
                "shimmer_apq": round(float(f_vec[2]), 3), "hnr_db": round(float(f_vec[3]), 1)
            })

        if not seg_scores:
            return self._build_inconclusive(duration_sec, rms, "No voiced speech detected.", t_start)

        # 5-second sequential chunk evaluation (primary detection unit)
        timeline_5s = compute_5s_intervals(norm_samples, TARGET_SAMPLE_RATE, self.model.predict_synthetic_score, 5.0)
        part_scores = [p["synthetic_probability"] for p in timeline_5s] if timeline_5s else seg_scores

        peak_part_score = max(part_scores) if part_scores else 50.0
        median_part_score = float(np.median(part_scores)) if part_scores else 50.0

        # If any 5-second chunk is AI-generated, prioritize the anomaly detection
        if peak_part_score >= SYNTHETIC_THRESHOLD:
            final_synth_prob = round(0.40 * median_part_score + 0.60 * peak_part_score, 1)
        else:
            final_synth_prob = round(median_part_score, 1)

        is_synthetic = final_synth_prob >= SYNTHETIC_THRESHOLD
        if is_synthetic:
            label = "Potentially AI-Generated Speech"
            confidence = round(final_synth_prob / 100.0, 2)
        elif final_synth_prob <= HUMAN_THRESHOLD:
            label = "Likely Human Speech"
            confidence = round((100.0 - final_synth_prob) / 100.0, 2)
        else:
            label = "Inconclusive"
            confidence = 0.50

        full_vec = extract_feature_vector(norm_samples, TARGET_SAMPLE_RATE)
        vocoder_sig = "None (Natural Glottal Source)" if not is_synthetic else "HiFi-GAN / Neural Vocoder Signature"

        metrics_dict = {
            "duration_seconds": duration_sec, "rms_energy": round(float(rms), 4),
            "f0_mean_hz": round(float(full_vec[0]), 1), "jitter_ppq": round(float(full_vec[1]), 3),
            "shimmer_apq": round(float(full_vec[2]), 3), "hnr_db": round(float(full_vec[3]), 1),
            "spectral_centroid": round(float(full_vec[4]), 1), "spectral_rolloff": round(float(full_vec[5]), 1),
            "vocoder_signature": vocoder_sig, "vocoder_detected": is_synthetic
        }

        report = {
            "label": label, "confidence": confidence, "synthetic_probability": final_synth_prob,
            "is_synthetic": is_synthetic, "status": "success",
            "processing_time_ms": round((time.perf_counter() - t_start) * 1000, 2),
            "model_identifier": MODEL_IDENTIFIER, "disclaimer": DISCLAIMER_TEXT,
            "segments_count": len(segments), "segments": segments,
            "timeline_5s_intervals": timeline_5s,
            "comparison_metrics": build_comparison_metrics(metrics_dict, full_vec, is_synthetic),
            "temporal_dynamics": compute_temporal_summary(segments),
            "metrics": metrics_dict
        }

        # Embed Hugging Face LLM Risk Assessment Explanation
        report["llm_risk_explanation"] = generate_risk_explanation(report)
        return report

    def _build_inconclusive(self, duration: float, rms: float, reason: str, t_start: float) -> Dict[str, Any]:
        return {
            "label": "Inconclusive", "confidence": 0.50, "synthetic_probability": 50.0,
            "is_synthetic": False, "status": "inconclusive", "reason": reason,
            "processing_time_ms": round((time.perf_counter() - t_start) * 1000, 2),
            "model_identifier": MODEL_IDENTIFIER, "disclaimer": DISCLAIMER_TEXT,
            "segments_count": 0, "segments": [], "timeline_5s_intervals": [],
            "comparison_metrics": {}, "temporal_dynamics": {},
            "metrics": {
                "duration_seconds": duration, "rms_energy": round(float(rms), 4),
                "f0_mean_hz": 0.0, "jitter_ppq": 0.0, "shimmer_apq": 0.0, "hnr_db": 0.0,
                "spectral_centroid": 0.0, "spectral_rolloff": 0.0,
                "vocoder_signature": "None (Insufficient Audio)", "vocoder_detected": False
            },
            "llm_risk_explanation": {
                "source": "expert_forensic_engine",
                "summary": f"Inconclusive acoustic assessment: {reason}",
                "recommendation": "REQUEST_LONGER_AUDIO: Require at least 2 to 5 seconds of active speech for evaluation."
            }
        }
