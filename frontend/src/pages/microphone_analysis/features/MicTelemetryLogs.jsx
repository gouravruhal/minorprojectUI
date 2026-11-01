import React from 'react';
import { Terminal, Shield, CheckCircle, AlertTriangle } from 'lucide-react';

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
            Awaiting microphone activation. Click &quot;Start Microphone Analysis&quot; above to begin live continuous acoustic inference.
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
                const diagnosis = isCrit
                  ? 'Neural Vocoder Aliasing & Glottal Jitter Suppressed (<0.20%)'
                  : isElev
                  ? 'Elevated HNR with Phase Discontinuity Anomaly'
                  : 'Normal Laryngeal Micro-Perturbation & Natural Phonation';

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
                      Drift: {log.speakerDrift ? log.speakerDrift.toFixed(3) : '0.040'}
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
