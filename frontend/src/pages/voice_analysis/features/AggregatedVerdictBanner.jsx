import React from 'react';
import { AlertOctagon, AlertTriangle, ShieldCheck, UserCheck, ShieldAlert, Zap } from 'lucide-react';
import './AggregatedVerdictBanner.css';

export function AggregatedVerdictBanner({ result }) {
  if (!result) return null;

  const risk = result.final_risk_score ?? result.riskScore ?? 50;
  const tier = result.final_threat_tier ?? result.threat_tier ?? (risk >= 75 ? 'CRITICAL' : risk >= 50 ? 'HIGH' : risk >= 30 ? 'ELEVATED' : 'LOW');
  const action = result.action_recommendation || (tier === 'CRITICAL' ? 'TERMINATE_CALL / STEP_UP_AUTHENTICATION' : 'ALLOW_CALL / STANDARD_MONITORING');
  const peak = result.peak_segment;
  const biometrics = result.speaker_verification;

  const isCritical = tier === 'CRITICAL' || risk >= 75;
  const isHigh = tier === 'HIGH' || (risk >= 50 && risk < 75);
  const isElevated = tier === 'ELEVATED' || (risk >= 30 && risk < 50);

  const getTierBadgeClass = () => {
    if (isCritical) return 'tier-critical';
    if (isHigh) return 'tier-high';
    if (isElevated) return 'tier-elevated';
    return 'tier-low';
  };

  return (
    <div className={`aggregated-banner-card card animate-fade-in ${getTierBadgeClass()}`}>
      <div className="banner-top-row">
        <div className="banner-verdict-col">
          <div className="banner-icon-bubble">
            {isCritical ? (
              <AlertOctagon size={28} className="text-danger" />
            ) : isHigh || isElevated ? (
              <AlertTriangle size={28} style={{ color: 'var(--accent-yellow)' }} />
            ) : (
              <ShieldCheck size={28} className="text-safe" />
            )}
          </div>
          <div>
            <div className="banner-eyebrow">HYBRID MULTI-SEGMENT VERDICT (0.55·MAX + 0.30·TOP3 + 0.15·MEAN)</div>
            <h3 className="banner-title">
              {result.label || (isCritical ? 'Critical Impersonation Attack Detected' : 'Likely Human Speech')}
            </h3>
          </div>
        </div>

        <div className="banner-score-group">
          <div className="score-block">
            <span className="score-label">AGGREGATED RISK</span>
            <span className="score-val">{risk}%</span>
          </div>
          <div className="score-badge-wrap">
            <span className={`threat-badge ${getTierBadgeClass()}`}>{tier}</span>
          </div>
        </div>
      </div>

      {/* Security Action Recommendation Strip */}
      <div className="action-recommendation-strip">
        <Zap size={15} style={{ color: 'var(--accent-blue)' }} />
        <span className="action-label">Recommended Action:</span>
        <span className="action-command">{action}</span>
      </div>

      {/* Quick Callout Strip for Peak Segment & Biometric Drift */}
      <div className="banner-details-row">
        {peak && (
          <div className="detail-chip">
            <span className="chip-label">Peak Threat Window:</span>
            <span className="chip-val" style={{ color: 'var(--accent-yellow)' }}>
              {peak.time_range} (Risk: {peak.risk_score})
            </span>
          </div>
        )}
        {biometrics && (
          <div className="detail-chip">
            <UserCheck size={13} style={{ color: 'var(--accent-green)' }} />
            <span className="chip-label">Speaker Drift:</span>
            <span className="chip-val" style={{ color: biometrics.max_drift >= 0.35 ? '#ef4444' : 'var(--accent-blue)' }}>
              {biometrics.max_drift !== undefined ? biometrics.max_drift.toFixed(2) : '0.00'}
              {biometrics.voice_swap_detected && ' (VOICE SWAP)'}
            </span>
          </div>
        )}
        <div className="detail-chip">
          <span className="chip-label">Model:</span>
          <span className="chip-val">{result.modelIdentifier || 'voiceshield-deep-fusion-v2'}</span>
        </div>
      </div>
    </div>
  );
}
export default AggregatedVerdictBanner;

