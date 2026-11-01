import React from 'react';
import { Layers, ShieldCheck, ShieldAlert } from 'lucide-react';

export function MultiModalFusionBreakdown({
  acousticRisk = 8.2,
  linguisticScore = 12,
  urgencyIndex = 14,
  voiceSwapDetected = false,
  unifiedRiskScore = 10,
  isCritical = false
}) {
  return (
    <div className="multi-modal-fusion-box clay-inset">
      <div className="flex-between">
        <h4 className="fusion-title flex-center gap-1">
          <Layers size={14} className="text-accent" />
          <span>Multi-Modal Threat Fusion Breakdown</span>
        </h4>
        <span className={`fusion-badge-tier ${isCritical ? 'tier-critical' : 'tier-safe'}`}>
          {isCritical ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
          <span>{isCritical ? 'MALICIOUS CONTEXT' : 'VERIFIED SAFE'}</span>
        </span>
      </div>

      <div className="fusion-breakdown-grid">
        <div className="fusion-item">
          <span className="fusion-label">Acoustic Spoof Risk</span>
          <span className={`fusion-val mono-metric ${acousticRisk >= 50 ? 'text-danger' : 'text-safe'}`}>
            {Math.round(acousticRisk)}%
          </span>
        </div>
        <div className="fusion-item">
          <span className="fusion-label">Linguistic Urgency</span>
          <span className={`fusion-val mono-metric ${urgencyIndex >= 50 ? 'text-danger' : 'text-safe'}`}>
            {urgencyIndex}%
          </span>
        </div>
        <div className="fusion-item">
          <span className="fusion-label">Biometric Consistency</span>
          <span className="fusion-val mono-metric">
            {voiceSwapDetected ? (
              <span className="text-danger font-bold">VOICE SWAP!</span>
            ) : (
              <span className="text-safe">Verified Match</span>
            )}
          </span>
        </div>
        <div className="fusion-item">
          <span className="fusion-label">Unified Bayesian Risk</span>
          <span className={`fusion-val mono-metric font-bold ${isCritical ? 'text-danger' : 'text-safe'}`}>
            {unifiedRiskScore}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default MultiModalFusionBreakdown;
