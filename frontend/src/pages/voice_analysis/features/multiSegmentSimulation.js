/**
 * Realistic 20-Second Spliced Call Forensic Simulation Data Generator.
 * Simulates a mid-call synthetic injection attack over 9 overlapping 4.0s blocks.
 */
export function generate20sSplicedCallResult(context = {}) {
  const sensitivity = context.transactionSensitivity || 'high';
  const isVoip = Boolean(context.unusualLocationOrVoipFlag);

  const segments = [
    {
      segment_index: 0, start_sec: 0.0, end_sec: 4.0, time_range: '00:00 - 00:04',
      spoof_prob: 8.2, risk_score: 12.4, threat_tier: 'LOW',
      speaker_drift: 0.00, voice_swap_detected: false,
      attributions: { spectral_anomaly: 11.2, phase_discontinuity: 9.5, prosodic_unnaturalness: 14.0 }
    },
    {
      segment_index: 1, start_sec: 2.0, end_sec: 6.0, time_range: '00:02 - 00:06',
      spoof_prob: 9.5, risk_score: 14.1, threat_tier: 'LOW',
      speaker_drift: 0.04, voice_swap_detected: false,
      attributions: { spectral_anomaly: 12.0, phase_discontinuity: 10.1, prosodic_unnaturalness: 15.2 }
    },
    {
      segment_index: 2, start_sec: 4.0, end_sec: 8.0, time_range: '00:04 - 00:08',
      spoof_prob: 11.0, risk_score: 16.5, threat_tier: 'LOW',
      speaker_drift: 0.06, voice_swap_detected: false,
      attributions: { spectral_anomaly: 13.5, phase_discontinuity: 11.4, prosodic_unnaturalness: 16.1 }
    },
    {
      segment_index: 3, start_sec: 6.0, end_sec: 10.0, time_range: '00:06 - 00:10',
      spoof_prob: 18.4, risk_score: 24.0, threat_tier: 'LOW',
      speaker_drift: 0.12, voice_swap_detected: false,
      attributions: { spectral_anomaly: 21.0, phase_discontinuity: 18.2, prosodic_unnaturalness: 22.5 }
    },
    {
      segment_index: 4, start_sec: 8.0, end_sec: 12.0, time_range: '00:08 - 00:12',
      spoof_prob: 64.5, risk_score: 68.2, threat_tier: 'HIGH',
      speaker_drift: 0.41, voice_swap_detected: true,
      attributions: { spectral_anomaly: 69.4, phase_discontinuity: 74.1, prosodic_unnaturalness: 65.0 }
    },
    {
      segment_index: 5, start_sec: 10.0, end_sec: 14.0, time_range: '00:10 - 00:14',
      spoof_prob: 92.4, risk_score: 91.5, threat_tier: 'CRITICAL',
      speaker_drift: 0.54, voice_swap_detected: true,
      attributions: { spectral_anomaly: 89.1, phase_discontinuity: 94.2, prosodic_unnaturalness: 87.5 }
    },
    {
      segment_index: 6, start_sec: 12.0, end_sec: 16.0, time_range: '00:12 - 00:16',
      spoof_prob: 96.8, risk_score: 95.2, threat_tier: 'CRITICAL',
      speaker_drift: 0.58, voice_swap_detected: true,
      attributions: { spectral_anomaly: 94.0, phase_discontinuity: 97.5, prosodic_unnaturalness: 92.2 }
    },
    {
      segment_index: 7, start_sec: 14.0, end_sec: 18.0, time_range: '00:14 - 00:18',
      spoof_prob: 94.1, risk_score: 93.4, threat_tier: 'CRITICAL',
      speaker_drift: 0.56, voice_swap_detected: true,
      attributions: { spectral_anomaly: 91.5, phase_discontinuity: 95.0, prosodic_unnaturalness: 89.8 }
    },
    {
      segment_index: 8, start_sec: 16.0, end_sec: 20.0, time_range: '00:16 - 00:20',
      spoof_prob: 90.6, risk_score: 89.1, threat_tier: 'CRITICAL',
      speaker_drift: 0.53, voice_swap_detected: true,
      attributions: { spectral_anomaly: 87.4, phase_discontinuity: 92.2, prosodic_unnaturalness: 86.0 }
    }
  ];

  // Hybrid Peak-Mean calculation: 0.55 * max + 0.30 * top3_mean + 0.15 * mean
  const finalRisk = 89.8;
  const peakSegment = segments[6];

  const intervals = segments.map((s) => ({
    interval_index: s.segment_index,
    time_range: s.time_range,
    synthetic_probability: s.spoof_prob,
    human_probability: Math.round((100.0 - s.spoof_prob) * 10) / 10,
    label: s.threat_tier === 'CRITICAL' ? 'AI Voice Clone' : (s.threat_tier === 'HIGH' ? 'Transition Anomaly' : 'Likely Human'),
    is_synthetic: s.threat_tier === 'CRITICAL' || s.threat_tier === 'HIGH',
    f0_hz: s.threat_tier === 'CRITICAL' ? 121.5 : 142.0,
    jitter_ppq: s.threat_tier === 'CRITICAL' ? 0.08 : 0.78,
    shimmer_apq: s.threat_tier === 'CRITICAL' ? 0.42 : 2.25,
    hnr_db: s.threat_tier === 'CRITICAL' ? 24.2 : 17.6
  }));

  const timelineLogs = segments.map((s) => ({
    time_range: s.time_range,
    status: s.threat_tier === 'CRITICAL' ? 'AI Voice Swap Alert' : (s.threat_tier === 'HIGH' ? 'Acoustic Transition Anomaly' : 'Likely Human Speech'),
    synthetic_probability: s.spoof_prob,
    human_probability: Math.round((100.0 - s.spoof_prob) * 10) / 10,
    diagnostic_text: s.voice_swap_detected
      ? `Critical biometric drift (${s.speaker_drift}) and vocoder phase anomalies detected in ${s.time_range}. Glottal tremor is unnaturally suppressed.`
      : `Natural human vocal micro-tremors and biological laryngeal acoustics verified in ${s.time_range}.`,
    telemetry: `Risk: ${s.risk_score} | Drift: ${s.speaker_drift} | Spectral: ${s.attributions.spectral_anomaly}% | Phase: ${s.attributions.phase_discontinuity}%`
  }));

  return {
    name: 'Simulated_20s_Spliced_Call.wav',
    analysisId: 'ANL-SPLICE-20S-01',
    duration: '20.0s',
    size: '2.44 MB',
    codec: '16,000 Hz Linear PCM',
    label: 'Critical Impersonation Attack Detected',
    isSynthetic: true,
    riskScore: finalRisk,
    final_risk_score: finalRisk,
    final_threat_tier: 'CRITICAL',
    threat_tier: 'CRITICAL',
    confidence: '98%',
    action_recommendation: 'TERMINATE_CALL / STEP_UP_AUTHENTICATION',
    overall_spoof_prob: 86.4,
    modelIdentifier: 'voiceshield-deep-fusion-v2',
    disclaimer: 'Probabilistic forensic estimation across 9 strided 4.0s analysis blocks.',
    segmentsCount: 9,
    segments,
    timeline_5s_intervals: intervals,
    peak_segment: peakSegment,
    speaker_verification: {
      enrolled: true,
      max_drift: 0.58,
      voice_swap_detected: true,
      verification_status: 'VOICE_SWAP_ALERT'
    },
    attributions: {
      spectral_anomaly: 64.2,
      phase_discontinuity: 68.7,
      prosodic_unnaturalness: 63.1
    },
    context_applied: {
      transaction_sensitivity: sensitivity,
      caller_trust_level: context.callerTrustLevel || 'standard',
      unusual_location_or_voip_flag: isVoip
    },
    llm_risk_explanation: {
      source: 'forensic_expert_system',
      threat_tier: 'CRITICAL',
      summary: '**Forensic Multi-Segment Analysis [CRITICAL]:** Utterance begins with authentic human vocal characteristics (0-8s). At second 8.0, an acute biometric shift (drift 0.41 -> 0.58) and neural vocoder phase discontinuity occur, confirming an in-call synthetic voice injection attack.',
      recommendation: 'TERMINATE_CALL: Immediate security step-up required. Intercept transaction and alert fraud operations.',
      timeline_logs: timelineLogs
    },
    metrics: {
      duration_seconds: 20.0,
      rms_energy: 0.088,
      f0_mean_hz: 132.4,
      jitter_ppq: 0.22,
      shimmer_apq: 0.95,
      hnr_db: 22.8,
      vocoder_signature: 'HiFi-GAN / Neural Phase Discontinuity (Injected @ 8.0s)',
      vocoder_detected: true
    },
    processingTimeMs: 38.2,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

