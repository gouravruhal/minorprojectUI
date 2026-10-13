import { formatLogTimestamp } from './voiceAnalysisHelpers';

export function createScenarioDetectionLogs(preset) {
  if (!preset) return [];
  const isCrit = preset.category === 'critical';

  return [
    {
      id: `scen-1-${Date.now()}`,
      timestamp: formatLogTimestamp(0),
      level: 'INGRESS',
      tag: 'RADIO LINK',
      message: `Cellular radio duplex link secured with SIM ${preset.callerNumber} (${preset.network || 'VoLTE'})`,
      isAbnormal: false
    },
    {
      id: `scen-2-${Date.now()}`,
      timestamp: formatLogTimestamp(120),
      level: isCrit ? 'WARN' : 'INFO',
      tag: 'KYC REGISTRY',
      message: `Subscriber Registry: ${preset.callerName}`,
      isAbnormal: isCrit
    },
    {
      id: `scen-3-${Date.now()}`,
      timestamp: formatLogTimestamp(260),
      level: isCrit ? 'ERROR' : 'DSP',
      tag: 'VOCODER DSP',
      message: isCrit
        ? `Neural vocoder artifact flagged: ${preset.vocoderSignature} (Phase Jitter: ${preset.jitterPPQ}%)`
        : `Natural glottal source verified: ${preset.vocoderSignature} (Phase Jitter: ${preset.jitterPPQ}%)`,
      isAbnormal: isCrit
    },
    {
      id: `scen-4-${Date.now()}`,
      timestamp: formatLogTimestamp(400),
      level: isCrit ? 'WARN' : 'DSP',
      tag: 'SHIMMER / BIO',
      message: isCrit
        ? `Synthetic envelope: Shimmer APQ ${preset.shimmerAPQ}%, Biometric Fit: ${preset.bioFit}%`
        : `Biomechanics intact: Shimmer APQ ${preset.shimmerAPQ}%, Biometric Fit: ${preset.bioFit}%`,
      isAbnormal: isCrit
    },
    {
      id: `scen-5-${Date.now()}`,
      timestamp: formatLogTimestamp(540),
      level: isCrit ? 'ALERT' : 'INFO',
      tag: 'AI PREDICTION',
      message: isCrit
        ? `CRITICAL RISK ${preset.baseRisk}% • Action: ${preset.recommendedAction}`
        : `AUTHENTIC CALLER ${preset.baseRisk}% • Action: ${preset.recommendedAction}`,
      isAbnormal: isCrit
    }
  ];
}
