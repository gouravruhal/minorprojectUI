import React from 'react';

export function MultiModalFusionBreakdown({ activeCall, linguisticScore, currentRiskScore, isCritical }) {
  return (
    <div className="multi-modal-fusion-box">
      <h4 className="fusion-title">Multi-Modal Threat Fusion Breakdown</h4>
      <div className="fusion-breakdown-grid">
        <div className="fusion-item">
          <span className="fusion-label">Acoustic Synthesizer Score</span>
          <span className="fusion-val mono-metric text-orange">{activeCall.acousticAnomaly}%</span>
        </div>
        <div className="fusion-item">
          <span className="fusion-label">Linguistic Urgency Score</span>
          <span className="fusion-val mono-metric text-orange">{linguisticScore}%</span>
        </div>
        <div className="fusion-item">
          <span className="fusion-label">Vocoder Signature</span>
          <span className="fusion-val mono-metric">{activeCall.vocoderSignature}</span>
        </div>
        <div className="fusion-item">
          <span className="fusion-label">Unified Bayesian Risk</span>
          <span className={`fusion-val mono-metric font-bold ${isCritical ? 'text-danger' : 'text-safe'}`}>
            {currentRiskScore}%
          </span>
        </div>
      </div>
    </div>
  );
}
