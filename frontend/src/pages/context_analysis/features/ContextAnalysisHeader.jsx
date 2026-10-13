import React from 'react';
import { SIMULATION_PRESETS } from '../../../core/state/useCallSession';

export function ContextAnalysisHeader({ activeCall, isCritical, onSelectPreset }) {
  return (
    <section className="context-header card">
      <div className="context-header-left">
        <div className="header-badge-row">
          <span className="badge badge-neutral">NLP MULTI-MODAL TIER</span>
          <span className={`badge ${isCritical ? 'badge-danger' : 'badge-safe'}`}>
            {isCritical ? 'MALICIOUS CONTEXT DETECTED' : 'NORMAL CONVERSATIONAL FLOW'}
          </span>
        </div>
        <h2 className="context-title">Conversational Context & Social Engineering Analysis</h2>
        <p className="context-subtitle">
          Natural language understanding (NLU) pipeline inspecting live speech transcripts for urgency markers, authority impersonation, and fraudulent transactional demands.
        </p>
      </div>

      <div className="context-preset-pills">
        {SIMULATION_PRESETS.map((preset) => (
          <button
            key={preset.id}
            className={`context-pill-btn ${activeCall.id === preset.id ? 'active' : ''}`}
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
