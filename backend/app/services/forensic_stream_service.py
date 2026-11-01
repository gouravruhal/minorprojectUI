"""
Forensic Stream & Real-Time Call Analysis Service.
Coordinates AudioPreprocessor, UnifiedForensicFeatureExtractor, ForensicDetectionModel,
SpeakerConsistencyTracker, and ForensicRiskEngine for real-time call telemetry.
"""
from typing import Dict, Any, Optional, Tuple
import os, time, uuid
import numpy as np
import torch

from AI.data.preprocessing_pipeline import AudioPreprocessor
from AI.features.unified_extractor import UnifiedForensicFeatureExtractor
from AI.models.forensic_classifier import ForensicDetectionModel
from AI.inference.speaker_verifier import SpeakerConsistencyTracker
from AI.inference.calibrator import PhysicsGuidedCalibrator
from backend.app.services.risk_engine import ForensicRiskEngine
from backend.app.services.multi_segment_aggregator import aggregate_segments
from backend.app.services.forensic_timeline_helper import build_forensic_report_extensions
from backend.app.database import repository
from AI.preprocessing.audio_normalizer import decode_audio_bytes

class ForensicStreamService:
    """Singleton service managing deep learning inference and active call session state."""

    def __init__(self):
        self.preprocessor = AudioPreprocessor(target_sr=16000, target_duration_sec=4.0)
        self.extractor = UnifiedForensicFeatureExtractor(sr=16000)
        self.calibrator = PhysicsGuidedCalibrator()
        self.model = ForensicDetectionModel(prosody_dim=12, embedding_dim=128)
        self.active_calls: Dict[str, Dict[str, Any]] = {}

        ckpt_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
            "AI", "checkpoints", "forensic_model_trained.pt"
        )
        if os.path.exists(ckpt_path):
            try:
                ckpt = torch.load(ckpt_path, map_location="cpu")
                self.model.load_state_dict(ckpt["model_state_dict"])
            except Exception:
                pass
        self.model.eval()

    def get_or_create_call_session(self, call_id: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if call_id not in self.active_calls:
            self.active_calls[call_id] = {
                "speaker_tracker": SpeakerConsistencyTracker(), "risk_engine": ForensicRiskEngine(),
                "context": context or {}, "pcm_buffer": np.array([], dtype=np.float32), "frame_count": 0
            }
        elif context:
            self.active_calls[call_id]["context"].update(context)
        return self.active_calls[call_id]

    def close_call_session(self, call_id: str):
        self.active_calls.pop(call_id, None)

    def _infer_window(self, chunk: np.ndarray) -> Tuple[float, np.ndarray, Dict[str, float]]:
        feats = self.extractor.extract_features(chunk)
        c_t = torch.tensor(np.stack([feats["lfcc"], feats["mfcc"]])).unsqueeze(0).float()
        s_t = torch.tensor(np.stack([feats["spectrogram"], feats["phase_derivative"]])).unsqueeze(0).float()
        p_t = torch.tensor([list(feats["prosody"].values())[:12]]).float()
        with torch.no_grad():
            out = self.model(c_t, s_t, p_t)
        raw_p = float(out["spoof_prob"].squeeze().item())
        emb = out["forensic_embedding"].squeeze().cpu().numpy()
        raw_attrs = {k: float(v.squeeze().item()) for k, v in out["attributions"].items()}
        p_spoof, attributions = self.calibrator.calibrate(raw_p, raw_attrs, feats, chunk, sr=16000)
        return p_spoof, emb, attributions

    def analyze_full_call(self, contents: bytes, filename: Optional[str] = None, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        t_start = time.perf_counter()
        raw_samples, sr = decode_audio_bytes(contents)
        sanitized = self.preprocessor.sanitize(raw_samples, orig_sr=sr)
        duration_sec = round(len(raw_samples) / float(sr), 2)
        windows = self.preprocessor.strided_windows(sanitized, window_sec=4.0, hop_sec=2.0)

        tracker = SpeakerConsistencyTracker()
        risk_engine = ForensicRiskEngine()
        segments = []

        for idx, (chunk, s_sec, e_sec) in enumerate(windows):
            p_spoof, emb, attributions = self._infer_window(chunk)
            spk_res = tracker.update_with_chunk(emb, spoof_prob=p_spoof)
            r_res = risk_engine.compute_risk(
                spoof_prob=p_spoof, attributions=attributions, speaker_drift=spk_res["speaker_drift"],
                voice_swap_detected=spk_res["voice_swap_detected"], context=context
            )
            segments.append({
                "segment_index": idx, "start_sec": s_sec, "end_sec": e_sec,
                "time_range": f"{int(s_sec//60):02d}:{int(s_sec%60):02d} - {int(e_sec//60):02d}:{int(e_sec%60):02d}",
                "spoof_prob": round(p_spoof * 100.0, 1), "risk_score": r_res["risk_score"],
                "threat_tier": r_res["threat_tier"], "speaker_drift": spk_res["speaker_drift"],
                "voice_swap_detected": spk_res["voice_swap_detected"],
                "attributions": {
                    "spectral_anomaly": round(attributions["spectral_score"] * 100.0, 1),
                    "phase_discontinuity": round(attributions["phase_score"] * 100.0, 1),
                    "prosodic_unnaturalness": round(attributions["prosodic_score"] * 100.0, 1)
                }
            })

        speaker_summary = {
            "enrolled": tracker.enrolled,
            "max_drift": max([s["speaker_drift"] for s in segments]) if segments else 0.0,
            "voice_swap_detected": any(s["voice_swap_detected"] for s in segments),
            "verification_status": "VOICE_SWAP_ALERT" if any(s["voice_swap_detected"] for s in segments) else "VERIFIED"
        }
        agg = aggregate_segments(segments, speaker_summary, context=context)
        ext = build_forensic_report_extensions(
            sanitized, duration_sec, agg,
            infer_fn=lambda c: self._infer_window(c)[0]
        )
        latency_ms = round((time.perf_counter() - t_start) * 1000.0, 2)
        analysis_id = f"ANL-{uuid.uuid4().hex[:10].upper()}"

        report = {
            "analysis_id": analysis_id, "filename": filename or "call_audio.wav",
            "duration_sec": duration_sec, "status": "COMPLETED", "latency_ms": latency_ms,
            "final_risk_score": agg["final_risk_score"], "risk_score": agg["final_risk_score"],
            "final_threat_tier": agg["final_threat_tier"], "threat_tier": agg["final_threat_tier"],
            "is_synthetic": bool(agg["final_risk_score"] >= 50.0),
            "action_recommendation": agg["action_recommendation"],
            "overall_spoof_prob": agg["overall_spoof_prob"], "spoof_probability": agg["overall_spoof_prob"],
            "peak_segment": agg["peak_segment"], "segments_count": len(segments), "segments": segments,
            "speaker_verification": speaker_summary, "attributions": agg["attributions"], "context_applied": context or {},
            "timeline_5s_intervals": ext["timeline_5s_intervals"],
            "comparison_metrics": ext["comparison_metrics"],
            "llm_risk_explanation": ext["llm_risk_explanation"],
            "metrics": ext["metrics"]
        }
        try:
            repository.save_analysis({
                "analysis_id": analysis_id, "session_id": (context or {}).get("call_id"),
                "mode": "telecom_rest", "filename": filename, "label": agg["final_threat_tier"],
                "confidence": round(agg["overall_spoof_prob"] / 100.0, 2),
                "synthetic_probability": agg["overall_spoof_prob"], "is_synthetic": bool(agg["final_risk_score"] >= 50.0),
                "status": "success", "processing_time_ms": latency_ms,
                "model_identifier": "voiceshield-deep-fusion-v2", "disclaimer": "Forensic estimation.",
                "segments_count": len(segments), "segments": segments,
                "timeline_5s_intervals": ext["timeline_5s_intervals"],
                "comparison_metrics": ext["comparison_metrics"],
                "llm_risk_explanation": ext["llm_risk_explanation"],
                "metrics": ext["metrics"]
            })
        except Exception:
            pass
        return report

    def process_stream_chunk(self, call_id: str, pcm_chunk: np.ndarray, sr: int = 16000) -> Optional[Dict[str, Any]]:
        session = self.get_or_create_call_session(call_id)
        mono_16k = self.preprocessor.to_mono(pcm_chunk)
        if sr != 16000 and sr > 0:
            mono_16k = self.preprocessor.resample_polyphase(mono_16k, sr)
        session["pcm_buffer"] = np.concatenate([session["pcm_buffer"], mono_16k])
        if len(session["pcm_buffer"]) < 32000:
            return None

        t0 = time.perf_counter()
        analysis_window = session["pcm_buffer"][-64000:]
        waveform = self.preprocessor.temporal_framing(analysis_window, mode="eval")
        p_spoof, emb, attributions = self._infer_window(waveform)

        spk_res = session["speaker_tracker"].update_with_chunk(emb, spoof_prob=p_spoof)
        r_res = session["risk_engine"].compute_risk(
            spoof_prob=p_spoof, attributions=attributions, speaker_drift=spk_res["speaker_drift"],
            voice_swap_detected=spk_res["voice_swap_detected"], context=session["context"]
        )
        session["frame_count"] += 1
        session["pcm_buffer"] = session["pcm_buffer"][-48000:]
        return {
            "call_id": call_id, "frame_index": session["frame_count"],
            "timestamp_sec": round(session["frame_count"] * 1.5, 2),
            "latency_ms": round((time.perf_counter() - t0) * 1000.0, 1),
            "threat_tier": r_res["threat_tier"], "risk_score": r_res["risk_score"],
            "action": r_res["action_recommendation"], "voice_swap": spk_res["voice_swap_detected"],
            "speaker_status": spk_res["verification_status"], "components": r_res["components"]
        }

forensic_stream_service = ForensicStreamService()
