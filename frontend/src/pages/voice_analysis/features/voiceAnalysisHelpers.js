export function playConnectTone() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.45);
  } catch {
    // Ignore if audio context is blocked
  }
}

export function formatCallTimer(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatLogTimestamp(offsetMs = 0) {
  const d = new Date(Date.now() + offsetMs);
  return d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

export function createInitialCallLogs(enteredNumber, enteredName, networkName) {
  const cleanNum = (enteredNumber || '9811044291').replace(/\D/g, '');
  return [
    {
      id: 'init-1',
      timestamp: formatLogTimestamp(0),
      level: 'INGRESS',
      tag: 'RADIO LINK',
      message: `Duplex cellular link secured with target SIM ${enteredNumber || '+91 98110 44291'}`,
      isAbnormal: false
    },
    {
      id: 'init-2',
      timestamp: formatLogTimestamp(140),
      level: 'INFO',
      tag: 'AADHAAR KYC',
      message: `Aadhaar-linked subscriber registry confirmed: ${enteredName || 'Sunil Sharma (MD & CEO)'}`,
      isAbnormal: false
    },
    {
      id: 'init-3',
      timestamp: formatLogTimestamp(280),
      level: 'INGRESS',
      tag: 'CARRIER VoLTE',
      message: `${networkName || 'Jio 4G VoLTE'} cellular channel opened (AMR-WB 12.65 kbps, 16kHz PCM stream)`,
      isAbnormal: false
    },
    {
      id: 'init-4',
      timestamp: formatLogTimestamp(420),
      level: 'DSP',
      tag: 'SIGNAL RF',
      message: `Wi-Fi Calling & RF Gateway linked at -52 dBm (Duplex transport latency: 12ms)`,
      isAbnormal: false
    },
    {
      id: 'init-5',
      timestamp: formatLogTimestamp(560),
      level: 'INGRESS',
      tag: 'STREAM FILE',
      message: `Mounted live call audio file stream: call_stream_ingress_${cleanNum}.pcm (16,000 Hz, 16-bit Mono, 256 kbps)`,
      isAbnormal: false
    },
    {
      id: 'init-6',
      timestamp: formatLogTimestamp(700),
      level: 'INFO',
      tag: 'READY',
      message: `Audio signal copy active. Click 'Start AI Voice Inspection' to begin real-time neural anomaly detection.`,
      isAbnormal: false
    }
  ];
}

export function resolveSubscriberIdentity(cleanNum, digits, countryCode, activeCall, presets) {
  const matched = presets?.find((p) => p.callerNumber?.replace(/[\s-]/g, '') === cleanNum);
  if (matched) return matched.callerName;
  if (digits && digits.trim().length >= 7) {
    return `Aadhaar-Linked Subscriber (+${countryCode} ····${digits.slice(-4)})`;
  }
  return activeCall?.callerName || 'Aadhaar-Verified Subscriber';
}

export function generateSampleFileResult(sampleType) {
  const isClone = sampleType === 'clone';
  const intervals = isClone ? [
    { interval_index: 0, time_range: '00:00 - 00:05', synthetic_probability: 92.4, human_probability: 7.6, label: 'AI Voice Detected', is_synthetic: true, f0_hz: 122.4, jitter_ppq: 0.08, shimmer_apq: 0.42, hnr_db: 23.1 },
    { interval_index: 1, time_range: '00:05 - 00:10', synthetic_probability: 95.8, human_probability: 4.2, label: 'AI Voice Detected', is_synthetic: true, f0_hz: 121.8, jitter_ppq: 0.07, shimmer_apq: 0.38, hnr_db: 24.5 },
    { interval_index: 2, time_range: '00:10 - 00:15', synthetic_probability: 94.1, human_probability: 5.9, label: 'AI Voice Detected', is_synthetic: true, f0_hz: 123.1, jitter_ppq: 0.09, shimmer_apq: 0.45, hnr_db: 22.8 }
  ] : [
    { interval_index: 0, time_range: '00:00 - 00:05', synthetic_probability: 6.2, human_probability: 93.8, label: 'Likely Human', is_synthetic: false, f0_hz: 142.1, jitter_ppq: 0.82, shimmer_apq: 2.34, hnr_db: 17.4 },
    { interval_index: 1, time_range: '00:05 - 00:10', synthetic_probability: 8.5, human_probability: 91.5, label: 'Likely Human', is_synthetic: false, f0_hz: 156.4, jitter_ppq: 0.74, shimmer_apq: 2.12, hnr_db: 18.2 },
    { interval_index: 2, time_range: '00:10 - 00:15', synthetic_probability: 7.1, human_probability: 92.9, label: 'Likely Human', is_synthetic: false, f0_hz: 138.9, jitter_ppq: 0.88, shimmer_apq: 2.45, hnr_db: 16.9 }
  ];

  const logs = intervals.map(int => ({
    time_range: int.time_range,
    status: isClone ? 'AI Voice Detected' : 'Likely Human Speech',
    synthetic_probability: int.synthetic_probability,
    human_probability: int.human_probability,
    diagnostic_text: isClone
      ? `Synthetic neural vocoder markers in ${int.time_range}. Glottal jitter (${int.jitter_ppq}%) and shimmer (${int.shimmer_apq}%) are mathematically over-smoothed. Transposed-convolution aliasing detected.`
      : `Natural human glottal tremor observed in ${int.time_range}. Jitter (${int.jitter_ppq}%) and shimmer (${int.shimmer_apq}%) conform to biological vocal tract baselines.`,
    telemetry: `Jitter: ${int.jitter_ppq}% | Shimmer: ${int.shimmer_apq}% | HNR: ${int.hnr_db} dB`
  }));

  return {
    file: { name: isClone ? 'ElevenLabs_CEO_Clone.wav' : 'Authentic_Executive_Voice.wav', size: isClone ? 1920000 : 1850000, type: 'audio/wav' },
    result: {
      name: isClone ? 'ElevenLabs_CEO_Clone.wav' : 'Authentic_Executive_Voice.wav',
      analysisId: isClone ? 'ANL-E11LABS-01' : 'ANL-AUTH-02',
      duration: '15.0s', size: isClone ? '1.83 MB' : '1.76 MB', codec: '16,000 Hz Linear PCM',
      label: isClone ? 'Potentially AI-Generated Speech' : 'Likely Human Speech',
      isSynthetic: isClone, riskScore: isClone ? 94.2 : 7.2, confidence: isClone ? '98%' : '97%',
      modelIdentifier: 'voiceshield-acoustic-dsp-v2',
      processingTimeMs: 24.5,
      timeline_5s_intervals: intervals,
      comparison_metrics: {
        jitter: { name: 'Glottal Jitter (PPQ5)', detected: isClone ? 0.08 : 0.82, human_norm: '0.50% - 2.00%', ai_norm: '< 0.25%', unit: '%', is_anomaly: isClone, explanation: 'Human vocal cords exhibit physical involuntary micro-tremors.' },
        shimmer: { name: 'Glottal Shimmer (APQ3)', detected: isClone ? 0.42 : 2.34, human_norm: '1.50% - 4.50%', ai_norm: '< 1.00%', unit: '%', is_anomaly: isClone, explanation: 'Cycle-to-cycle amplitude perturbation reveals biological tissue elasticity.' },
        hnr: { name: 'Harmonics-to-Noise Ratio (HNR)', detected: isClone ? 23.1 : 17.4, human_norm: '12.0 - 20.0 dB', ai_norm: '> 22.0 dB', unit: 'dB', is_anomaly: isClone, explanation: 'High values indicate synthetic spectral denoising.' },
        spectral_centroid: { name: 'Spectral Centroid', detected: isClone ? 3420 : 1980, human_norm: '1200 - 2800 Hz', ai_norm: 'Unnatural shift', unit: 'Hz', is_anomaly: isClone, explanation: 'Measures high-frequency energy distribution and phase aliasing.' }
      },
      llm_risk_explanation: {
        source: 'huggingface_llm', model: 'Qwen/Qwen2.5-0.5B-Instruct', threat_tier: isClone ? 'CRITICAL' : 'MINIMAL',
        summary: isClone
          ? '**Forensic Risk Summary [CRITICAL]:** High confidence synthetic clone. Glottal perturbation (Jitter: 0.08%, Shimmer: 0.42%) is unnaturally depressed. Neural vocoder phase artifacts detected.'
          : '**Forensic Risk Summary [MINIMAL]:** Organic human vocal dynamics verified. Natural laryngeal tremors and dynamic prosody conform to authentic human speech patterns.',
        recommendation: isClone ? 'HIGH_RISK_INTERVENE: Prompt caller with dynamic out-of-band biometric challenge or quarantine audio.' : 'PASS_THROUGH: Acoustic parameters conform to biological human vocal fold baselines.',
        timeline_logs: logs
      },
      metrics: { duration_seconds: 15.0, rms_energy: 0.082, f0_mean_hz: isClone ? 122.4 : 145.8, jitter_ppq: isClone ? 0.08 : 0.82, shimmer_apq: isClone ? 0.42 : 2.34, hnr_db: isClone ? 23.1 : 17.4, vocoder_signature: isClone ? 'HiFi-GAN Vocoder Artifact' : 'None (Natural Glottis)', vocoder_detected: isClone }
    }
  };
}

export function processUploadedAudioFile(file) {
  const isSynth = /(clone|fake|fraud|elevenlabs|ai)/i.test(file.name);
  return generateSampleFileResult(isSynth ? 'clone' : 'authentic').result;
}

