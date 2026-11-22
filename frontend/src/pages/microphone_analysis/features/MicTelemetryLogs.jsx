import React from 'react';
import { Terminal } from 'lucide-react';

function formatForensicDiagnosis(log, isCrit, isElev) {
  const dsp = log.dspFeatures;
  const isSwap = log.voiceSwap ||
    log.speakerVerification?.voice_swap_detected ||
    log.speakerVerification?.vip_verification?.impersonation_detected;

  if (isSwap) {
    const matchPct = log.speakerVerification?.vip_verification?.voiceprint_match_pct ?? 0;
    return `Impersonation Mismatch: Voiceprint match ${Math.round(matchPct)}% (Threshold: 82%)`;
  }

  if (dsp) {
    const pitch = Math.round(dsp.f0_pitch_hz ?? dsp.f0_mean ?? 0);
    const jitter = Number(dsp.jitter_percent ?? (dsp.jitter_ppq ? dsp.jitter_ppq * 100 : 0)).toFixed(2);
    const shimmer = Number(dsp.shimmer_percent ?? (dsp.shimmer_apq ? dsp.shimmer_apq * 100 : 0)).toFixed(2);
    if (isCrit) {
      return `Synthetic Vocoder: Glottal Jitter ${jitter}%, Pitch ${pitch}Hz, Flatness ${Number(dsp.spectral_flatness || 0.02).toFixed(3)}`;
    }
    if (isElev) {
      const pause = Math.round((dsp.pause_ratio ?? 0) * 100);
      return `Prosodic Discontinuity: Jitter ${jitter}%, Pause ${pause}%, Shimmer ${shimmer}%`;
    }
    return `Organic Phonation: Jitter ${jitter}%, Shimmer ${shimmer}%, F0 ${pitch}Hz`;
  }

  return isCrit
    ? 'Neural Vocoder Aliasing & Glottal Jitter Suppressed'
    : isElev
    ? 'Elevated HNR with Phase Discontinuity Anomaly'
    : 'Normal Laryngeal Micro-Perturbation & Natural Phonation';
}

export function MicTelemetryLogs({ logs = [] }) {
  return (
    <div className="mic-telemetry-logs-card card clay-card">
      <div className="panel-header-row">
        <div className="panel-title-group">
          <Terminal size={18} className="text-accent" />
          <h3 className="panel-heading">Live Telemetry & Evaluation Logs (Every 2s)</h3>
        </div>
        <span className="mono-metric text-dim text-xs">
          Total Evaluated Cycles: {logs.length}
        </span>
      </div>

      <div className="telemetry-table-container clay-inset">
        {logs.length === 0 ? (
          <div className="empty-logs-placeholder text-dim text-xs">
            Awaiting streaming activation. Click &quot;Start Streaming Analysis&quot; above to begin live acoustic inference.
          </div>
        ) : (
          <table className="telemetry-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Interval</th>
                <th>Risk Score</th>
                <th>Threat Tier</th>
                <th>Biometrics</th>
                <th>Acoustic Forensic Diagnosis</th>
                <th>Protocol Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 50).map((log, idx) => {
                const isCrit = log.threatTier === 'CRITICAL' || log.riskScore >= 70;
                const isElev = log.threatTier === 'ELEVATED' || (log.riskScore >= 45 && !isCrit);
                const diagnosis = formatForensicDiagnosis(log, isCrit, isElev);
                const driftVal = log.speakerDrift ?? log.speakerVerification?.max_drift;

                return (
                  <tr key={idx} className={isCrit ? 'row-alert' : ''}>
                    <td className="mono-metric text-xs">{log.timeLabel}</td>
                    <td className="mono-metric text-xs">#{log.chunkId} (T+{log.timestampSec}s)</td>
                    <td className="mono-metric text-xs font-bold">
                      <span className={isCrit ? 'text-danger' : isElev ? 'text-warning' : 'text-safe'}>
                        {log.riskScore}%
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${isCrit ? 'badge-danger' : isElev ? 'badge-warning' : 'badge-safe'}`}>
                        {log.threatTier}
                      </span>
                    </td>
                    <td className="mono-metric text-xs">
                      Drift: {typeof driftVal === 'number' ? driftVal.toFixed(3) : '--'}
                    </td>
                    <td className="text-xs text-dim">
                      {diagnosis}
                    </td>
                    <td>
                      <span className="mono-metric text-xs text-accent">
                        {log.action}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default MicTelemetryLogs;
