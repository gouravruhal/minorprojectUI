import React from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { generateAcousticAnomalies } from './acousticAnomaliesData';
import './AcousticAnomalies.css';

export function AcousticAnomaliesList({
  isDisplaySynthetic = false,
  _isStreaming = false,
  detectedAbnormalities: propAbnormalities,
  liveJitter,
  liveShimmer,
  liveLiveness,
  spectralCentroid
}) {
  const detectedAbnormalities = propAbnormalities || generateAcousticAnomalies(
    isDisplaySynthetic,
    liveJitter,
    liveShimmer,
    liveLiveness,
    spectralCentroid
  );

  return (
    <div className="call-analysis-anomalies-section">
      <div className="anomalies-section-header">
        <div className="anomalies-title-row">
          {isDisplaySynthetic ? (
            <ShieldAlert size={17} className="text-danger" />
          ) : (
            <ShieldCheck size={17} className="text-safe" />
          )}
          <h4 className="anomalies-heading">Acoustic Diagnostics & Verification</h4>
        </div>

        <span className={`anomaly-counter-pill ${isDisplaySynthetic ? 'danger' : 'safe'}`}>
          <span className={`anomaly-pulse-dot ${isDisplaySynthetic ? 'danger' : 'safe'}`} />
          <span>
            {isDisplaySynthetic 
              ? `${detectedAbnormalities.length} Anomalies Detected` 
              : '0 Anomalies • Verified'}
          </span>
        </span>
      </div>

      <div className="anomalies-cards-list">
        {detectedAbnormalities.map((item) => (
          <div 
            key={item.id} 
            className={`anomaly-card-item ${item.severity} animate-fade-in`}
          >
            <div className="anomaly-card-top">
              <span className="anomaly-item-title">{item.title}</span>
              <span className={`anomaly-status-badge ${item.severity}`}>
                {item.badge}
              </span>
            </div>

            <div className="anomaly-metrics-line">
              <span className="anomaly-metric-val">{item.metric}</span>
              <span className="anomaly-baseline-val">({item.baseline})</span>
            </div>

            <p className="anomaly-item-desc">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
