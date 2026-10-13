import React from 'react';
import { SIMULATION_PRESETS } from '../../../core/state/useCallSession';

export function RiskAssessmentHeader({ activeCall, isCritical, isSuspicious, onSelectPreset }) {
  return (
    <section className="risk-header card">
      <div className="risk-header-left">
        <div className="header-badge-row">
          <span className="badge badge-neutral">MATHEMATICAL ENGINE</span>
          <span className={`badge ${isCritical ? 'badge-danger' : isSuspicious ? 'badge-warn' : 'badge-safe'}`}>
            {isCritical ? 'CRITICAL RISK LEVEL' : isSuspicious ? 'SUSPICIOUS DRIFT' : 'AUTHENTIC SIGNATURE'}
          </span>
        </div>
        <h2 className="risk-title">Bayesian Temporal Risk Telemetry</h2>
        <p className="risk-subtitle">
          Dynamic probabilistic threat computation fusing multi-frame acoustic spectral distances, glottal biological features, neural vocoder phase traces, and conversational urgency.
        </p>
      </div>

      <div className="risk-preset-pills">
        {SIMULATION_PRESETS.map((preset) => (
          <button
            key={preset.id}
            className={`risk-pill-btn ${activeCall.id === preset.id ? 'active' : ''}`}
            onClick={() => onSelectPreset(preset)}
          >
            <span className={`pill-dot ${preset.category === 'critical' ? 'danger' : 'safe'}`} />
            <span>{preset.title.split(' (')[0]}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
