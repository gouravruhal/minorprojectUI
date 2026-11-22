import React from 'react';
import { Cpu, ShieldAlert, ShieldCheck } from 'lucide-react';

export function MicRiskMeter({ latestResult, isStreaming }) {
  const risk = latestResult ? Number(latestResult.riskScore ?? 0).toFixed(1) : '0.0';
  const tier = latestResult ? latestResult.threatTier : (isStreaming ? 'INITIALIZING' : 'STANDBY');
  const isCritical = latestResult?.riskScore >= 70 || tier === 'CRITICAL';
  const isWarn = (latestResult?.riskScore >= 40 && !isCritical) || tier === 'WARN';

  const breakdown = latestResult?.riskBreakdown;
  const dsp = latestResult?.dspFeatures;

  return (
    <div className="mic-risk-meter-card card clay-card">
      <div className="panel-header-row">
        <div className="panel-title-group">
          <Cpu size={18} className="text-accent" />
          <h3 className="panel-heading">Dynamic Weighted Risk Engine</h3>
        </div>
        <span className={`badge ${isCritical ? 'badge-danger' : isWarn ? 'badge-warning' : isStreaming ? 'badge-safe' : 'badge-neutral'}`}>
          {tier}
        </span>
      </div>

      <div className="risk-display-hero clay-inset">
        <div className="risk-score-col">
          <span className="risk-big-number mono-metric">{latestResult ? `${risk}%` : '--'}</span>
          <span className="risk-caption text-dim text-xs">Weighted Composite (0-100)</span>
        </div>
        <div className="risk-status-col">
          {latestResult ? (
            isCritical ? (
              <div className="threat-pill threat-danger">
                <ShieldAlert size={16} /> <span>Critical Threat Action Triggered</span>
              </div>
            ) : isWarn ? (
              <div className="threat-pill threat-warning">
                <ShieldAlert size={16} /> <span>Warning: Request Operator Callback</span>
              </div>
            ) : (
              <div className="threat-pill threat-safe">
                <ShieldCheck size={16} /> <span>Safe: Verified Acoustic Biometrics</span>
              </div>
            )
          ) : (
            <div className="threat-pill threat-neutral">
              <span>{isStreaming ? 'Buffering Audio Stream...' : 'Sensor Ready for Ingress'}</span>
            </div>
          )}
          <span className="mono-metric text-xs text-dim">
            Latency: {latestResult?.latencyMs ? `${latestResult.latencyMs}ms` : (latestResult?.clientLatencyMs ? `${latestResult.clientLatencyMs}ms` : '--')}
          </span>
        </div>
      </div>

      <div className="weighted-engine-breakdown">
        <div className="breakdown-title-row">
          <span className="text-xs font-bold text-main">Risk Formulation Breakdown</span>
          <span className="text-xs text-dim">50% + 20% + 15% + 15%</span>
        </div>

        <div className="breakdown-bars-grid">
          <div className="breakdown-metric-col">
            <div className="breakdown-label-row">
              <span className="text-xs text-dim">Model (50%)</span>
              <span className="mono-metric text-xs">{breakdown ? `${breakdown.model_score}%` : '--'}</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill fill-blue" style={{ width: breakdown ? `${breakdown.model_score}%` : '0%' }} />
            </div>
          </div>

          <div className="breakdown-metric-col">
            <div className="breakdown-label-row">
              <span className="text-xs text-dim">Prosody (20%)</span>
              <span className="mono-metric text-xs">{breakdown ? `${breakdown.prosody_score}%` : '--'}</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill fill-yellow" style={{ width: breakdown ? `${breakdown.prosody_score}%` : '0%' }} />
            </div>
          </div>

          <div className="breakdown-metric-col">
            <div className="breakdown-label-row">
              <span className="text-xs text-dim">Speaker (15%)</span>
              <span className="mono-metric text-xs">{breakdown ? `${breakdown.speaker_score}%` : '--'}</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill fill-purple" style={{ width: breakdown ? `${breakdown.speaker_score}%` : '0%' }} />
            </div>
          </div>

          <div className="breakdown-metric-col">
            <div className="breakdown-label-row">
              <span className="text-xs text-dim">Context (15%)</span>
              <span className="mono-metric text-xs">{breakdown ? `${breakdown.context_score}%` : '--'}</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill fill-red" style={{ width: breakdown ? `${breakdown.context_score}%` : '0%' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="dsp-telemetry-chips-row">
        <div className="dsp-chip">
          <span className="dsp-label">Pitch F0</span>
          <span className="dsp-val">{dsp ? `${Number(dsp.f0_pitch_hz).toFixed(1)} Hz` : '--'}</span>
        </div>
        <div className="dsp-chip">
          <span className="dsp-label">Jitter PPQ</span>
          <span className="dsp-val">{dsp ? `${Number(dsp.jitter_percent).toFixed(3)}%` : '--'}</span>
        </div>
        <div className="dsp-chip">
          <span className="dsp-label">Shimmer APQ</span>
          <span className="dsp-val">{dsp ? `${Number(dsp.shimmer_percent).toFixed(3)}%` : '--'}</span>
        </div>
        <div className="dsp-chip">
          <span className="dsp-label">Pause Ratio</span>
          <span className="dsp-val">{dsp ? `${Number(dsp.pause_ratio).toFixed(3)}` : '--'}</span>
        </div>
      </div>
    </div>
  );
}

export default MicRiskMeter;
