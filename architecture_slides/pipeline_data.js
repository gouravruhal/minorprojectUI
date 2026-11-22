/**
 * VoiceShield AI - Architecture & Dataflow Showcase Pipeline Data
 * Stores structural specifications for stages, nodes, connections, and comparative prediction scenarios.
 */
export const PIPELINE_STAGES = [
  {
    id: "ingress_dsp",
    number: "01",
    name: "Zero-Disk Ingress & DSP Sanitization",
    category: "dsp",
    color: "#0284c7",
    summary: "Captures 48kHz live microphone or telecom stream, applies polyphase sinc resampling to 16kHz, 40Hz HP filter, and hangover VAD in RAM.",
    badge: "100% In-Memory RAM Processing",
    nodes: [
      { id: "mic_ingress", label: "Audio Ingress", type: "ingress", sub: "Live Mic / WS / 16kHz PCM" },
      { id: "poly_resample", label: "Polyphase Resampler", type: "dsp", sub: "Kaiser Sinc -> 16,000 Hz" },
      { id: "butterworth_hp", label: "40Hz Butterworth HP", type: "dsp", sub: "4th-Order DC & Rumble Strip" },
      { id: "vad_framing", label: "Hangover VAD & Framing", type: "dsp", sub: "2.0s Sliding Window Stream" }
    ]
  },
  {
    id: "feature_extraction",
    number: "02",
    name: "Multilingual Acoustic & Phase Extraction",
    category: "features",
    color: "#475569",
    summary: "Extracts language-agnostic representations across frequency, phase space, and glottal laryngeal biomechanics (Indian English & Hindi robust).",
    badge: "Language-Agnostic Triple-Stream",
    nodes: [
      { id: "cepstral_stream", label: "Cepstral Stream", type: "feat", sub: "LFCC (60-bin) + MFCC (40-bin)" },
      { id: "spectral_phase", label: "Spectral & Phase", type: "feat", sub: "Bispectrum Phase Discontinuity" },
      { id: "prosodic_biomech", label: "Glottal Biomechanics", type: "feat", sub: "Jitter PPQ5, Shimmer, F0 Pitch" }
    ]
  },
  {
    id: "neural_backbone",
    number: "03",
    name: "Deep ResNet & VIP Speaker Verifier",
    category: "neural",
    color: "#6366f1",
    summary: "Dual-stream 2D residual CNN backbones process spectro-temporal tensors into 128-dim biometric embeddings evaluated against enrolled VIPs.",
    badge: "PyTorch Deep Fusion + VIP Bank",
    nodes: [
      { id: "dual_resnet", label: "Dual-Stream ResNet", type: "model", sub: "Conv2D Spatial Feature Maps" },
      { id: "attention_pool", label: "Multi-Head Attention", type: "model", sub: "Self-Attention Weighted Pooling" },
      { id: "forensic_emb", label: "VIP Voiceprint Verifier", type: "model", sub: "Cosine Match vs Rajesh / Anita" }
    ]
  },
  {
    id: "physics_calibrator",
    number: "04",
    name: "4-Factor Weighted Dynamic Risk Engine",
    category: "calibrator",
    color: "#ea580c",
    summary: "Combines 50% Acoustic Model + 20% Prosody Anomaly + 15% VIP Match + 15% Call Context (VoIP, >₹50k transfer, known contact).",
    badge: "4-Factor Weighted Risk (0-100)",
    nodes: [
      { id: "sub260_eval", label: "Acoustic Score (50%)", type: "calib", sub: "Deep Neural & Vocoder Risk" },
      { id: "jitter_bounds", label: "Prosody Anomaly (20%)", type: "calib", sub: "Jitter, Shimmer & F0 Bounds" },
      { id: "respiration_pause", label: "VIP & Context (30%)", type: "calib", sub: "Speaker Match & Wire Context" }
    ]
  },
  {
    id: "decision_engine",
    number: "05",
    name: "Automated Incident Mitigation Engine",
    category: "verdict",
    color: "#16a34a",
    summary: "Executes automated protocol policies: 0-39 Safe (Monitor), 40-69 Warn (Request Callback), 70+ Critical (Freeze Wire / Trigger Step-Up MFA).",
    badge: "Autonomous Safeguard Thresholds",
    nodes: [
      { id: "risk_calc", label: "Dynamic Risk Verdict", type: "decision", sub: "0-39 Safe / 40-69 Warn / 70+ Crit" },
      { id: "threat_tier", label: "Protocol Enforcement", type: "decision", sub: "FREEZE / STEP-UP MFA / MONITOR" },
      { id: "llm_explainer", label: "FastAPI REST & WS SDK", type: "decision", sub: "Swagger /docs & Client Snippets" }
    ]
  }
];

export const PREDICTION_SCENARIOS = {
  human: {
    title: "Scenario A: Bona Fide Indian English Voice",
    badge: "GENUINE HUMAN",
    badgeType: "safe",
    accentColor: "#16a34a",
    riskScore: 7.9,
    threatTier: "SAFE",
    action: "CONTINUE_MONITORING",
    isSynthetic: false,
    metrics: {
      sub260Ratio: "0.0355 (Natural glottal bass)",
      jitterPPQ: "0.85% (Natural laryngeal tremor)",
      shimmerAPQ: "2.42% (Healthy amplitude jitter)",
      f0Variation: "138 Hz (Natural pitch inflection)",
      respirationGaps: "Present (Organic pauses)"
    },
    flowPath: ["mic_ingress", "poly_resample", "butterworth_hp", "vad_framing", "prosodic_biomech", "attention_pool", "jitter_bounds", "respiration_pause", "threat_tier"],
    verdictSummary: "Acoustic glottal pulses verify natural vocal cord biomechanics. Involuntary laryngeal jitter confirms genuine human speaker."
  },
  ai_direct: {
    title: "Scenario B: Direct Neural Vocoder Clone",
    badge: "SYNTHETIC CLONE",
    badgeType: "threat",
    accentColor: "#ea580c",
    riskScore: 66.9,
    threatTier: "WARN",
    action: "REQUEST_CALLBACK",
    isSynthetic: true,
    metrics: {
      sub260Ratio: "0.1285 (Direct DSP generation)",
      jitterPPQ: "0.18% (Suppressed vocoder jitter)",
      shimmerAPQ: "0.92% (Micro-amplitude rigidity)",
      f0Variation: "4.8 Hz (Metronomic pitch contour)",
      respirationGaps: "Absent (Continuous stream)"
    },
    flowPath: ["mic_ingress", "poly_resample", "cepstral_stream", "spectral_phase", "dual_resnet", "forensic_emb", "sub260_eval", "risk_calc", "threat_tier"],
    verdictSummary: "Overly smooth pitch modulation and suppressed glottal jitter (<0.20%) reveal neural synthesis typical of HiFi-GAN and FastSpeech."
  },
  vip_impersonation: {
    title: "Scenario C: Executive Wire Fraud & VIP Impersonation",
    badge: "CRITICAL SPOOF ATTACK",
    badgeType: "critical",
    accentColor: "#dc2626",
    riskScore: 92.4,
    threatTier: "CRITICAL",
    action: "FREEZE_TRANSACTION",
    isSynthetic: true,
    metrics: {
      claimedIdentity: "Rajesh Sharma (CEO, VIP-001)",
      voiceprintMatch: "14.2% (Cosine Distance Mismatch)",
      transactionAmount: "₹85,000 (Exceeds ₹50k Threshold)",
      networkRoute: "VoIP Untrusted Route",
      laryngealJitter: "0.15% (Vocoder Flattened Phonation)"
    },
    flowPath: ["mic_ingress", "poly_resample", "butterworth_hp", "spectral_phase", "dual_resnet", "forensic_emb", "sub260_eval", "respiration_pause", "threat_tier"],
    verdictSummary: "Deepfake synthesis coupled with unauthorized CEO impersonation on high-value transfer triggers instantaneous transaction freeze and step-up MFA."
  }
};
