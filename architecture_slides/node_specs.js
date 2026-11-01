/**
 * Mathematical and algorithmic specifications for VoiceShield AI pipeline nodes.
 */
export const NODE_SPECS = {
  mic_ingress: "x[n] sampled at fs = 48,000 Hz, 16-bit PCM dynamic range",
  poly_resample: "Polyphase sinc anti-aliasing filter with Kaiser window: fs -> 16,000 Hz",
  butterworth_hp: "4th-order zero-phase Butterworth filter: fc = 40.0 Hz, -24dB/octave",
  vad_framing: "Frame-energy hangover VAD with 2.0s rolling windows / 4.0s eval tensors",
  cepstral_stream: "LFCC 60-channel linear filterbank + MFCC 40 triangular filterbanks",
  spectral_phase: "256-point STFT magnitude + Group Delay Phase Derivative dθ/dt",
  prosodic_biomech: "Micro-tremor Jitter PPQ5 & Shimmer APQ3 with F0 parabolic peak refine",
  dual_resnet: "Dual-stream 2D residual CNN with 3x3 kernel spatial convolutions",
  attention_pool: "Multi-head scaled dot-product self-attention pooling across time frames",
  forensic_emb: "128-dimensional dense biometric embedding for speaker & spoof tracking",
  sub260_eval: "Loudspeaker cutoff test: sub_260_ratio = Σ(f<260)|X(f)|² / Σ|X(f)|² < 0.020",
  jitter_bounds: "Biomechanical laryngeal bounds: natural human phonation ∈ [0.48%, 2.65%]",
  respiration_pause: "Respiratory gasp cadence: pauses >= 100ms with natural unvoiced ratio",
  risk_calc: "Fused probability: 0.50*P_nn + 0.50*max(0.55, 0.50 + AI_ev - 0.40*Human_ev)",
  threat_tier: "Deterministic boundaries: LOW (<25%), GUARDED (<50%), ELEVATED (<75%), CRITICAL (>=75%)",
  llm_explainer: "Structured Hugging Face reasoning trace formatted with context metadata"
};

export function getNodeSpec(nodeId) {
  return NODE_SPECS[nodeId] || "Deterministic acoustic feature extraction and telemetry monitoring.";
}
