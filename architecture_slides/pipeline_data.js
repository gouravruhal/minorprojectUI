/**
 * VoiceShield AI - Architecture & Dataflow Showcase Pipeline Data
 * Stores structural specifications for stages, nodes, connections, and comparative prediction scenarios.
 */
export const PIPELINE_STAGES = [
  {
    id: "ingress_dsp",
    number: "01",
    name: "Audio Ingress & DSP Sanitization",
    category: "dsp",
    color: "#0284c7",
    summary: "Captures 48kHz live microphone or telecom stream, applies polyphase sinc resampling to 16kHz, 40Hz HP filter, and hangover VAD.",
    badge: "Hardware & DSP Invariants",
    nodes: [
      { id: "mic_ingress", label: "Audio Ingress", type: "ingress", sub: "48kHz Live Mic / WAV" },
      { id: "poly_resample", label: "Polyphase Resampler", type: "dsp", sub: "Kaiser Sinc -> 16,000 Hz" },
      { id: "butterworth_hp", label: "40Hz Butterworth HP", type: "dsp", sub: "4th-Order DC & Rumble Strip" },
      { id: "vad_framing", label: "Hangover VAD & Framing", type: "dsp", sub: "2.0s / 4.0s Strided Windows" }
    ]
  },
  {
    id: "feature_extraction",
    number: "02",
    name: "Multi-View Acoustic Extraction",
    category: "features",
    color: "#475569",
    summary: "Extracts orthogonal representations across frequency, phase space, and laryngeal glottal biomechanics.",
    badge: "Orthogonal Triple-Stream",
    nodes: [
      { id: "cepstral_stream", label: "Cepstral Stream", type: "feat", sub: "LFCC (60-bin) + MFCC (40-bin)" },
      { id: "spectral_phase", label: "Spectral & Phase", type: "feat", sub: "STFT Mag + Group Delay Phase dθ" },
      { id: "prosodic_biomech", label: "Glottal Biomechanics", type: "feat", sub: "Jitter PPQ5, Shimmer APQ3, F0" }
    ]
  },
  {
    id: "neural_backbone",
    number: "03",
    name: "Deep ResNet & Attention Core",
    category: "neural",
    color: "#6366f1",
    summary: "Dual-stream 2D residual CNN backbones process spectro-temporal tensors into a 128-dimensional biometric embedding.",
    badge: "PyTorch Deep Fusion",
    nodes: [
      { id: "dual_resnet", label: "Dual-Stream ResNet", type: "model", sub: "Conv2D Spatial Feature Maps" },
      { id: "attention_pool", label: "Multi-Head Attention", type: "model", sub: "Self-Attention Weighted Pooling" },
      { id: "forensic_emb", label: "Forensic Biometric Vec", type: "model", sub: "128-Dim Latent Embedding" }
    ]
  },
  {
    id: "physics_calibrator",
    number: "04",
    name: "Physics-Guided Forensic Calibrator",
    category: "calibrator",
    color: "#ea580c",
    summary: "Fuses deep neural probability with deterministic physical invariants: loudspeaker cutoff and bounded micro-tremor.",
    badge: "Physics Constraints",
    nodes: [
      { id: "sub260_eval", label: "Sub-260Hz Loudspeaker", type: "calib", sub: "Phone Cutoff (E<260 / Etot)" },
      { id: "jitter_bounds", label: "Biomechanical Jitter", type: "calib", sub: "Bounded [0.48%, 2.65%]" },
      { id: "respiration_pause", label: "Pause & Respiration", type: "calib", sub: "Organic Respiratory Gaps" }
    ]
  },
  {
    id: "decision_engine",
    number: "05",
    name: "Verdict & Decision Engine",
    category: "verdict",
    color: "#16a34a",
    summary: "Computes calibrated risk score, assigns threat tier, and triggers automated policy actions with LLM explanations.",
    badge: "Autonomous Safeguard",
    nodes: [
      { id: "risk_calc", label: "Calibrated Risk Score", type: "decision", sub: "Weighted Context Risk [0-100%]" },
      { id: "threat_tier", label: "Threat Tier & Policy", type: "decision", sub: "LOW / ELEVATED / CRITICAL" },
      { id: "llm_explainer", label: "Forensic LLM Context", type: "decision", sub: "Hugging Face Audit Trail" }
    ]
  }
];

export const PREDICTION_SCENARIOS = {
  human: {
    title: "Scenario A: Bona Fide Human Voice",
    badge: "GENUINE HUMAN",
    badgeType: "safe",
    accentColor: "#16a34a",
    riskScore: 14.8,
    threatTier: "LOW",
    action: "CONTINUE_MONITORING",
    isSynthetic: false,
    metrics: {
      sub260Ratio: "0.0355 (Natural glottal bass)",
      jitterPPQ: "1.12% (Natural laryngeal tremor)",
      shimmerAPQ: "2.35% (Healthy amplitude jitter)",
      f0Variation: "99.9 Hz (Dynamic natural intonation)",
      respirationGaps: "Present (Organic breath pauses)"
    },
    flowPath: ["mic_ingress", "poly_resample", "butterworth_hp", "vad_framing", "prosodic_biomech", "attention_pool", "jitter_bounds", "respiration_pause", "threat_tier"],
    verdictSummary: "Acoustic glottal pulses verify natural vocal cord biomechanics. Involuntary laryngeal jitter and sub-260Hz phonation confirm physical human vocal apparatus."
  },
  ai_direct: {
    title: "Scenario B: Direct AI Vocoder (TTS / Voice Clone)",
    badge: "SYNTHETIC CLONE",
    badgeType: "threat",
    accentColor: "#ea580c",
    riskScore: 61.5,
    threatTier: "ELEVATED",
    action: "TRIGGER_MFA_CHALLENGE",
    isSynthetic: true,
    metrics: {
      sub260Ratio: "0.1285 (Direct DSP generation)",
      jitterPPQ: "0.24% (Unnaturally flat vocoder)",
      shimmerAPQ: "0.85% (Micro-amplitude rigidity)",
      f0Variation: "4.2 Hz (Metronomic pitch contour)",
      respirationGaps: "Absent (Continuous stream)"
    },
    flowPath: ["mic_ingress", "poly_resample", "cepstral_stream", "spectral_phase", "dual_resnet", "forensic_emb", "sub260_eval", "risk_calc", "threat_tier"],
    verdictSummary: "Overly smooth pitch modulation and suppressed glottal jitter (<0.35%) reveal mathematical synthesis typical of HiFi-GAN and FastSpeech neural vocoders."
  },
  phone_replay: {
    title: "Scenario C: Phone Loudspeaker Replay Spoof",
    badge: "LOUDSPEAKER REPLAY SPOOF",
    badgeType: "critical",
    accentColor: "#dc2626",
    riskScore: 77.2,
    threatTier: "CRITICAL",
    action: "TERMINATE_TRANSACTION",
    isSynthetic: true,
    metrics: {
      sub260Ratio: "0.0165 (Sharp sub-260Hz cutoff)",
      jitterPPQ: "4.82% (Transducer phase distortion)",
      shimmerAPQ: "5.10% (Loudspeaker harmonic boost)",
      f0Variation: "Phone resonance peaks in 2-4 kHz",
      respirationGaps: "Missing respiratory gasps"
    },
    flowPath: ["mic_ingress", "poly_resample", "butterworth_hp", "spectral_phase", "dual_resnet", "sub260_eval", "jitter_bounds", "risk_calc", "threat_tier"],
    verdictSummary: "Severe low-frequency acoustic attenuation (<260Hz) and transducer non-linear resonance detect synthetic audio replayed from mobile phone into microphone."
  }
};

