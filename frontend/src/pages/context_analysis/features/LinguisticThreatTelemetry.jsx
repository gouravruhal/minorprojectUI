import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

export function LinguisticThreatTelemetry({
  linguisticScore = 12,
  urgencyIndex = 14,
  intentCategory = 'Normal Conversation',
  isCritical = false
}) {
  const isLingHigh = linguisticScore >= 60;
  const isUrgHigh = urgencyIndex >= 60;

  return (
    <div className="telemetry-metric-cards">
      <div className="metric-score-card clay-inset">
        <div className="metric-card-top">
          <span className="metric-name flex-center gap-1">
            <AlertCircle size={14} className={isLingHigh ? 'text-danger' : 'text-safe'} />
            <span>Linguistic Anomaly Score</span>
          </span>
          <span className={`metric-percentage mono-metric ${isLingHigh ? 'text-danger' : 'text-safe'}`}>
            {linguisticScore}%
          </span>
        </div>
        <div className="metric-bar-track">
          <div
            className={`metric-bar-fill ${isLingHigh ? 'fill-danger' : 'fill-safe'}`}
            style={{ width: `${Math.min(100, Math.max(5, linguisticScore))}%` }}
          />
        </div>
        <span className="metric-caption">
          Semantic divergence from legitimate executive/client operational baseline.
        </span>
      </div>

      <div className="metric-score-card clay-inset">
        <div className="metric-card-top">
          <span className="metric-name flex-center gap-1">
            <ShieldAlert size={14} className={isUrgHigh ? 'text-danger' : 'text-safe'} />
            <span>Urgency & Psychological Pressure</span>
          </span>
          <span className={`metric-percentage mono-metric ${isUrgHigh ? 'text-danger' : 'text-safe'}`}>
            {urgencyIndex}%
          </span>
        </div>
        <div className="metric-bar-track">
          <div
            className={`metric-bar-fill ${isUrgHigh ? 'fill-danger' : 'fill-safe'}`}
            style={{ width: `${Math.min(100, Math.max(5, urgencyIndex))}%` }}
          />
        </div>
        <span className="metric-caption">
          Detection of time-compression manipulation ("immediately", "before deadline", "bypass").
        </span>
      </div>
    </div>
  );
}

export default LinguisticThreatTelemetry;
