import React from 'react';
import { ShieldCheck, ShieldAlert, Cpu, Zap, Activity } from 'lucide-react';

export function MicRiskMeter({ latestResult, isStreaming }) {
  const risk = latestResult ? Number(latestResult.riskScore ?? 0).toFixed(1) : '0.0';
  const tier = latestResult ? latestResult.threatTier : 'IDLE';
  const isCritical = latestResult?.riskScore >= 70;
  const isElevated = latestResult?.riskScore >= 40 && !isCritical;

  const attrs = latestResult?.attributions || {
    spectral_score: 0.05,
    phase_score: 0.04,
    prosodic_score: 0.06
  };

  const spectral = Math.round((attrs.spectral_score || attrs.spectral_anomaly || 0.05) * 100);
  const phase = Math.round((attrs.phase_score || attrs.phase_discontinuity || 0.04) * 100);
  const prosody = Math.round((attrs.prosodic_score || attrs.prosodic_unnaturalness || 0.06) * 100);

  return (
    <div className="mic-risk-meter-card card clay-card">
      <div className="panel-header-row">
        <div className="panel-title-group">
          <Cpu size={18} className="text-accent" />
          <h3 className="panel-heading">Real-Time Acoustic Risk</h3>
        </div>
        <span className={`badge ${isCritical ? 'badge-danger' : isElevated ? 'badge-warning' : 'badge-safe'}`}>
          {tier}
        </span>
      </div>

      <div className="risk-display-hero clay-inset">
        <div className="risk-score-col">
          <span className="risk-big-number mono-metric">{isStreaming ? `${risk}%` : '--'}</span>
          <span className="risk-caption text-dim text-xs">Synthetic Probability (2.0s Window)</span>
        </div>
        <div className="risk-status-col">
          {isCritical ? (
            <div className="threat-pill threat-danger">
              <ShieldAlert size={16} />
              <span>Deepfake Suspect Detected</span>
            </div>
          ) : (
            <div className="threat-pill threat-safe">
              <ShieldCheck size={16} />
              <span>Authentic Human Phonation</span>
            </div>
          )}
          <span className="mono-metric text-xs text-dim">
            Latency: {latestResult?.latencyMs ? `${latestResult.latencyMs}ms` : '--'}
          </span>
        </div>
      </div>

      <div className="mic-anomaly-breakdown">
        <div className="anomaly-item">
          <div className="anomaly-label-row">
            <span>Spectral Anomaly</span>
            <span className="mono-metric">{isStreaming ? `${spectral}%` : '--'}</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill fill-blue" style={{ width: `${spectral}%` }} />
          </div>
        </div>

        <div className="anomaly-item">
          <div className="anomaly-label-row">
            <span>Phase Discontinuity</span>
            <span className="mono-metric">{isStreaming ? `${phase}%` : '--'}</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill fill-green" style={{ width: `${phase}%` }} />
          </div>
        </div>

        <div className="anomaly-item">
          <div className="anomaly-label-row">
            <span>Prosodic Unnaturalness</span>
            <span className="mono-metric">{isStreaming ? `${prosody}%` : '--'}</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill fill-yellow" style={{ width: `${prosody}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MicRiskMeter;

