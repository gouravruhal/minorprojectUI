import React from 'react';

export function LinguisticThreatTelemetry({ linguisticScore, isCritical }) {
  return (
    <div className="telemetry-metric-cards">
      <div className="metric-score-card">
        <div className="metric-card-top">
          <span className="metric-name">Linguistic Anomaly Score</span>
          <span className={`metric-percentage mono-metric ${isCritical ? 'text-danger' : 'text-safe'}`}>
            {linguisticScore}%
          </span>
        </div>
        <div className="metric-bar-track">
          <div 
            className={`metric-bar-fill ${isCritical ? 'fill-danger' : 'fill-safe'}`} 
            style={{ width: `${linguisticScore}%` }}
          />
        </div>
        <span className="metric-caption">
          NLP semantic distance from legitimate executive operational baseline.
        </span>
      </div>

      <div className="metric-score-card">
        <div className="metric-card-top">
          <span className="metric-name">Urgency & Pressure Index</span>
          <span className={`metric-percentage mono-metric ${isCritical ? 'text-danger' : 'text-safe'}`}>
            {isCritical ? '96%' : '14%'}
          </span>
        </div>
        <div className="metric-bar-track">
          <div 
            className={`metric-bar-fill ${isCritical ? 'fill-danger' : 'fill-safe'}`} 
            style={{ width: isCritical ? '96%' : '14%' }}
          />
        </div>
        <span className="metric-caption">
          Presence of artificial coercion ("immediately", "bypass verification", "emergency funds").
        </span>
      </div>
    </div>
  );
}
