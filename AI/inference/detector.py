"""
Inference engine for VoiceShield AI.
Provides single-load model inference, segment-level inspection, and report generation.
"""
import os
import time
import numpy as np

from AI.configs.inference_config import (
    TARGET_SAMPLE_RATE, MIN_SEGMENT_DURATION_SEC, DEFAULT_WINDOW_SEC,
    DEFAULT_HOP_SEC, ENERGY_THRESHOLD_RMS, SYNTHETIC_THRESHOLD,
    HUMAN_THRESHOLD, MODEL_IDENTIFIER, DISCLAIMER_TEXT
)
from AI.models.classifier import AcousticForensicClassifier
from AI.preprocessing.audio_normalizer import (
    decode_audio_bytes, to_mono_16k, normalize_rms, compute_rms
)
from AI.preprocessing.feature_extractor import extract_feature_vector
from AI.preprocessing.segmenter import segment_audio

class VoiceDeepfakeDetector:
    """Singleton inference detector maintaining the loaded model checkpoint in memory."""

    def __init__(self, model_checkpoint_path: str = None):
        if model_checkpoint_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            model_checkpoint_path = os.path.join(base_dir, "models", "checkpoint.joblib")

        self.model = AcousticForensicClassifier()
        if os.path.exists(model_checkpoint_path):
            try:
                self.model.load(model_checkpoint_path)
            except Exception:
                pass

    def analyze_bytes(self, audio_bytes: bytes) -> dict:
        """Decodes raw audio bytes and executes forensic inspection."""
        samples, sr = decode_audio_bytes(audio_bytes)
        return self.analyze_waveform(samples, sr)

    def analyze_waveform(self, samples: np.ndarray, sr: int = TARGET_SAMPLE_RATE) -> dict:
        """Executes full multi-segment forensic analysis over an audio waveform."""
        t_start = time.perf_counter()
        samples = to_mono_16k(samples, sr)
        duration_sec = round(len(samples) / float(TARGET_SAMPLE_RATE), 2)
        rms = compute_rms(samples)

        if duration_sec < MIN_SEGMENT_DURATION_SEC:
            return self._build_inconclusive_report(
                duration_sec, rms, "Audio segment too brief (minimum 400ms required).", t_start
            )

        if rms < ENERGY_THRESHOLD_RMS:
            return self._build_inconclusive_report(
                duration_sec, rms, "Audio energy below speech activity threshold (silence or background noise).", t_start
            )

        norm_samples = normalize_rms(samples)
        segments = []
        scores = []

        for seg_samples, start_t, end_t in segment_audio(
            norm_samples, TARGET_SAMPLE_RATE, DEFAULT_WINDOW_SEC, DEFAULT_HOP_SEC
        ):
            if compute_rms(seg_samples) < ENERGY_THRESHOLD_RMS:
                continue

            f_vec = extract_feature_vector(seg_samples, TARGET_SAMPLE_RATE)
            seg_score = round(self.model.predict_synthetic_score(f_vec), 1)
            scores.append(seg_score)

            segments.append({
                "start_time_sec": start_t,
                "end_time_sec": end_t,
                "synthetic_probability": seg_score,
                "label": "AI Clone" if seg_score >= SYNTHETIC_THRESHOLD else ("Human" if seg_score <= HUMAN_THRESHOLD else "Inconclusive"),
                "f0_hz": round(float(f_vec[0]), 1),
                "jitter_ppq": round(float(f_vec[1]), 3),
                "shimmer_apq": round(float(f_vec[2]), 3),
                "hnr_db": round(float(f_vec[3]), 1)
            })

        if not scores:
            return self._build_inconclusive_report(duration_sec, rms, "No voiced speech activity detected in audio.", t_start)

        final_synth_prob = round(float(np.median(scores)), 1)
        full_f_vec = extract_feature_vector(norm_samples, TARGET_SAMPLE_RATE)

        if final_synth_prob >= SYNTHETIC_THRESHOLD:
            overall_label = "Potentially AI-Generated Speech"
            confidence = round(final_synth_prob / 100.0, 2)
            is_synthetic = True
        elif final_synth_prob <= HUMAN_THRESHOLD:
            overall_label = "Likely Human Speech"
            confidence = round((100.0 - final_synth_prob) / 100.0, 2)
            is_synthetic = False
        else:
            overall_label = "Inconclusive"
            confidence = 0.50
            is_synthetic = False

        vocoder_sig = "None (Natural Glottal Source)" if not is_synthetic else "HiFi-GAN / Neural Vocoder Signature"

        return {
            "label": overall_label,
            "confidence": confidence,
            "synthetic_probability": final_synth_prob,
            "is_synthetic": is_synthetic,
            "status": "success",
            "processing_time_ms": round((time.perf_counter() - t_start) * 1000, 2),
            "model_identifier": MODEL_IDENTIFIER,
            "disclaimer": DISCLAIMER_TEXT,
            "segments_count": len(segments),
            "segments": segments,
            "metrics": {
                "duration_seconds": duration_sec,
                "rms_energy": round(float(rms), 4),
                "f0_mean_hz": round(float(full_f_vec[0]), 1),
                "jitter_ppq": round(float(full_f_vec[1]), 3),
                "shimmer_apq": round(float(full_f_vec[2]), 3),
                "hnr_db": round(float(full_f_vec[3]), 1),
                "spectral_centroid": round(float(full_f_vec[4]), 1),
                "spectral_rolloff": round(float(full_f_vec[5]), 1),
                "vocoder_signature": vocoder_sig,
                "vocoder_detected": is_synthetic
            }
        }

    def _build_inconclusive_report(self, duration: float, rms: float, reason: str, t_start: float) -> dict:
        return {
            "label": "Inconclusive",
            "confidence": 0.50,
            "synthetic_probability": 50.0,
            "is_synthetic": False,
            "status": "inconclusive",
            "reason": reason,
            "processing_time_ms": round((time.perf_counter() - t_start) * 1000, 2),
            "model_identifier": MODEL_IDENTIFIER,
            "disclaimer": DISCLAIMER_TEXT,
            "segments_count": 0,
            "segments": [],
            "metrics": {
                "duration_seconds": duration,
                "rms_energy": round(float(rms), 4),
                "f0_mean_hz": 0.0,
                "jitter_ppq": 0.0,
                "shimmer_apq": 0.0,
                "hnr_db": 0.0,
                "spectral_centroid": 0.0,
                "spectral_rolloff": 0.0,
                "vocoder_signature": "None (Insufficient Audio)",
                "vocoder_detected": False
            }
        }

