"""
Forensic Stream & Real-Time Call Analysis Service.
Coordinates AudioPreprocessor, UnifiedForensicFeatureExtractor, ForensicDetectionModel,
VIP Speaker Verifier, Audio-Language LLM, and ForensicRiskEngine.
"""
from typing import Dict, Any, Optional, Tuple
import os, time, uuid
import numpy as np
import torch

from AI.data.preprocessing_pipeline import AudioPreprocessor
from AI.features.unified_extractor import UnifiedForensicFeatureExtractor
from AI.models.forensic_classifier import ForensicDetectionModel
from AI.inference.speaker_verifier import SpeakerConsistencyTracker, verify_against_vip, get_enrolled_vip_catalog
from AI.inference.calibrator import PhysicsGuidedCalibrator
from backend.app.services.risk_engine import ForensicRiskEngine
from backend.app.services.multi_segment_aggregator import aggregate_segments
from backend.app.services.forensic_timeline_helper import build_forensic_report_extensions
from backend.app.services.forensic_speech_helper import evaluate_speech_intent
from backend.app.services.forensic_report_builder import build_and_save_report
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

    def _infer_window(self, chunk: np.ndarray) -> Tuple[float, np.ndarray, Dict[str, float], Dict[str, float]]:
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
        return p_spoof, emb, attributions, feats["prosody"]

    def analyze_full_call(self, contents: bytes, filename: Optional[str] = None, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        t_start = time.perf_counter()
        raw_samples, sr = decode_audio_bytes(contents)
        sanitized = self.preprocessor.sanitize(raw_samples, orig_sr=sr)
        duration_sec = round(len(raw_samples) / float(sr), 2)
        windows = self.preprocessor.strided_windows(sanitized, window_sec=4.0, hop_sec=2.0)

        tracker = SpeakerConsistencyTracker()
        risk_engine = ForensicRiskEngine()
        segments = []
        claimed_vip = (context or {}).get("claimed_vip") or (context or {}).get("claimed_identity")

        # Evaluate initial window to seed VIP verification
        vip_res = {"impersonation_detected": False, "voiceprint_match_pct": 100.0}
        for idx, (chunk, s_sec, e_sec) in enumerate(windows):
            p_spoof, emb, attributions, prosody = self._infer_window(chunk)
            spk_res = tracker.update_with_chunk(emb, spoof_prob=p_spoof)
            vip_res = verify_against_vip(emb, claimed_vip_id=claimed_vip)
            spk_metrics = {
                "voice_swap_detected": spk_res["voice_swap_detected"],
                "speaker_drift": spk_res["speaker_drift"],
                "impersonation_detected": vip_res["impersonation_detected"],
                "voiceprint_match_pct": vip_res["voiceprint_match_pct"],
                "claimed_vip": claimed_vip
            }
            r_res = risk_engine.compute_risk(
                spoof_prob=p_spoof, attributions=attributions, dsp_features=prosody,
                speaker_metrics=spk_metrics, context=context
            )
            segments.append({
                "segment_index": idx, "start_sec": s_sec, "end_sec": e_sec,
                "time_range": f"{int(s_sec//60):02d}:{int(s_sec%60):02d} - {int(e_sec//60):02d}:{int(e_sec%60):02d}",
                "spoof_prob": round(p_spoof * 100.0, 1), "risk_score": r_res["risk_score"],
                "threat_tier": r_res["threat_tier"], "speaker_drift": spk_res["speaker_drift"],
                "voice_swap_detected": spk_res["voice_swap_detected"],
                "attributions": {
                    "spectral_anomaly": round(attributions.get("spectral_score", 0.05) * 100.0, 1),
                    "phase_discontinuity": round(attributions.get("phase_score", 0.04) * 100.0, 1),
                    "prosodic_unnaturalness": round(attributions.get("prosodic_score", 0.06) * 100.0, 1)
                },
                "dsp_features": {
                    "f0_pitch_hz": prosody.get("f0_mean", 135.0),
                    "jitter_percent": prosody.get("jitter_ppq", 0.35),
                    "shimmer_percent": prosody.get("shimmer_apq", 2.5),
                    "pause_ratio": prosody.get("pause_ratio", 0.20)
                }
            })

        speaker_summary = {
            "enrolled": tracker.enrolled, "max_drift": max([s["speaker_drift"] for s in segments]) if segments else 0.0,
            "voice_swap_detected": any(s["voice_swap_detected"] for s in segments),
            "impersonation_detected": vip_res["impersonation_detected"] if claimed_vip else False,
            "vip_verification": vip_res, "available_vips": get_enrolled_vip_catalog()
        }
        agg = aggregate_segments(segments, speaker_summary, context=context)

        # Multi-Modal Audio-Language LLM Analysis
        speech_intent = evaluate_speech_intent(
            contents, sr=16000, claimed_vip=claimed_vip,
            vip_verification=vip_res, acoustic_prob=agg["overall_spoof_prob"]
        )

        ext = build_forensic_report_extensions(sanitized, duration_sec, agg, infer_fn=lambda c: self._infer_window(c)[0])
        latency_ms = round((time.perf_counter() - t_start) * 1000.0, 2)
        analysis_id = f"ANL-{uuid.uuid4().hex[:10].upper()}"

        return build_and_save_report(
            analysis_id, filename or "call_audio.wav", duration_sec, latency_ms,
            agg, segments, speaker_summary, ext, context, speech_intent
        )

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
        p_spoof, emb, attributions, prosody = self._infer_window(waveform)

        spk_res = session["speaker_tracker"].update_with_chunk(emb, spoof_prob=p_spoof)
        claimed_vip = session["context"].get("claimed_vip") or session["context"].get("claimed_identity")
        vip_res = verify_against_vip(emb, claimed_vip_id=claimed_vip)
        spk_metrics = {
            "voice_swap_detected": spk_res["voice_swap_detected"],
            "speaker_drift": spk_res["speaker_drift"],
            "impersonation_detected": vip_res["impersonation_detected"],
            "voiceprint_match_pct": vip_res["voiceprint_match_pct"],
            "claimed_vip": claimed_vip
        }

        # Real-time audio language intent check on live sliding window
        speech_intent = evaluate_speech_intent(
            analysis_window, sr=16000, claimed_vip=claimed_vip,
            vip_verification=vip_res, acoustic_prob=p_spoof * 100.0
        )

        r_res = session["risk_engine"].compute_risk(
            spoof_prob=p_spoof, attributions=attributions, dsp_features=prosody,
            speaker_metrics=spk_metrics, context=session["context"],
            speech_analysis=speech_intent
        )
        session["frame_count"] += 1
        session["pcm_buffer"] = session["pcm_buffer"][-48000:]
        return {
            "call_id": call_id, "frame_index": session["frame_count"],
            "timestamp_sec": round(session["frame_count"] * 1.5, 2),
            "latency_ms": round((time.perf_counter() - t0) * 1000.0, 1),
            "threat_tier": r_res["threat_tier"], "risk_score": r_res["risk_score"],
            "action": r_res["action_recommendation"], "voice_swap": spk_res["voice_swap_detected"],
            "speaker_status": vip_res["status"] if claimed_vip else spk_res["verification_status"],
            "vip_verification": vip_res, "risk_breakdown": r_res["risk_breakdown"],
            "speech_text_analysis": speech_intent,
            "dsp_features": {
                "f0_pitch_hz": prosody.get("f0_mean", 135.0),
                "jitter_percent": prosody.get("jitter_ppq", 0.35),
                "shimmer_percent": prosody.get("shimmer_apq", 1.8),
                "pause_ratio": prosody.get("pause_ratio", 0.12),
                "spectral_flatness": prosody.get("spectral_flatness", 0.015)
            }
        }

forensic_stream_service = ForensicStreamService()
