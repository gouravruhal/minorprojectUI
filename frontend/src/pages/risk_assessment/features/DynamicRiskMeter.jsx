import React from 'react';
import { ShieldAlert, ShieldCheck, AlertOctagon } from 'lucide-react';
import { useTheme } from '../../../core/theme/ThemeContext';
import './DynamicRiskMeter.css';

export function DynamicRiskMeter({ riskScore, isStreaming }) {
  const { themeTokens } = useTheme();
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, riskScore));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  let riskTier = 'safe';
  let tierLabel = 'AUTHENTIC SPEECH';
  let tierDesc = 'Acoustic phase & glottal dynamics match genuine human biology.';

  if (clampedScore >= 70) {
    riskTier = 'critical';
    tierLabel = 'CRITICAL DEEPFAKE ALERT';
    tierDesc = 'Neural vocoder artifacts & phase anomalies detected in real-time stream.';
  } else if (clampedScore >= 35) {
    riskTier = 'warning';
    tierLabel = 'SUSPICIOUS IMPERSONATION';
    tierDesc = 'Acoustic inconsistencies detected; initiate challenge protocol.';
  }

  return (
    <div className={`dynamic-risk-meter glass-panel tier-${riskTier}`} id="risk-meter-container">
      <div className="meter-header">
        <div className="meter-title-row">
          {riskTier === 'critical' ? (
            <AlertOctagon size={18} className="icon-danger" />
          ) : riskTier === 'warning' ? (
            <ShieldAlert size={18} className="icon-warn" />
          ) : (
            <ShieldCheck size={18} className="icon-safe" />
          )}
          <h2 className="meter-heading">Dynamic Impersonation Risk Score</h2>
        </div>
        <span className={`badge badge-${riskTier === 'critical' ? 'danger' : riskTier === 'warning' ? 'warn' : 'safe'}`}>
          {tierLabel}
        </span>
      </div>

      <div className="meter-body">
        <div className="radial-gauge-container">
          <svg className="radial-svg" width="200" height="200" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="safeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={themeTokens?.safeGreen || '#10B981'} />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>
              <linearGradient id="warnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={themeTokens?.warnAmber || '#EA580C'} />
                <stop offset="100%" stopColor={themeTokens?.accentPeach || '#FED7AA'} />
              </linearGradient>
              <linearGradient id="dangerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={themeTokens?.dangerRed || '#EF4444'} />
                <stop offset="100%" stopColor={themeTokens?.accentPrimary || '#EA580C'} />
              </linearGradient>
            </defs>

            <circle className="gauge-track" cx="100" cy="100" r={radius} strokeWidth="14" />
            <circle
              className="gauge-progress"
              cx="100"
              cy="100"
              r={radius}
              strokeWidth="14"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              stroke={
                riskTier === 'critical'
                  ? 'url(#dangerGrad)'
                  : riskTier === 'warning'
                  ? 'url(#warnGrad)'
                  : 'url(#safeGrad)'
              }
            />
          </svg>

          <div className="gauge-center-content">
            <div className="score-number-row">
              <span className="score-val mono-metric" id="current-risk-number">
                {isStreaming ? clampedScore : '--'}
              </span>
              <span className="score-unit">%</span>
            </div>
            <span className="score-subcaption">RISK INDEX</span>
          </div>
        </div>

        <div className="meter-details">
          <p className="tier-explanation">{tierDesc}</p>
          <div className="meter-threshold-legend">
            <div className="legend-marker">
              <span className="legend-dot safe-dot" />
              <span>0-34% Safe</span>
            </div>
            <div className="legend-marker">
              <span className="legend-dot warn-dot" />
              <span>35-69% Suspicious</span>
            </div>
            <div className="legend-marker">
              <span className="legend-dot danger-dot" />
              <span>70-100% Spoof</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
