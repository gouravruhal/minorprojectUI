import React from 'react';
import { FileAudio, ShieldAlert, ShieldCheck, ChevronRight, Clock, Activity } from 'lucide-react';

export function HistoryTileView({ records = [], onSelectRecord }) {
  if (records.length === 0) {
    return (
      <div className="empty-history-box text-dim text-sm clay-inset">
        Database is currently empty and initialized for testing. Upload an audio recording under &quot;Recording Analysis&quot; or speak into your mic under &quot;Microphone Analysis&quot; to generate live forensic database records!
      </div>
    );
  }

  return (
    <div className="history-tiles-grid">
      {records.map((rec, idx) => {
        const risk = Number(rec.riskScore ?? rec.synthetic_probability ?? 10);
        const isCrit = risk >= 70 || rec.threatTier === 'CRITICAL' || rec.label === 'CRITICAL';
        const tier = rec.threatTier || rec.label || (risk >= 70 ? 'CRITICAL' : risk >= 45 ? 'ELEVATED' : 'LOW');
        const dur = rec.duration || `${rec.duration_seconds || 4.0}s`;

        return (
          <div
            key={idx}
            className="history-tile-card card clay-card"
            onClick={() => onSelectRecord(rec)}
          >
            <div className="tile-top-row">
              <div className="tile-icon-bubble">
                <FileAudio size={18} className="text-accent" />
              </div>
              <span className={`badge ${isCrit ? 'badge-danger' : 'badge-safe'}`}>
                {tier}
              </span>
            </div>

            <div className="tile-title-group">
              <h4 className="tile-title">{rec.filename || rec.title}</h4>
              <span className="tile-subtitle text-xs text-dim">
                {rec.callerName || 'Standard Caller Ingress'}
              </span>
            </div>

            <div className="tile-metrics-strip clay-inset">
              <div className="tile-metric-col">
                <span className="tile-m-k">Synthetic Risk</span>
                <span className={`tile-m-v mono-metric font-bold ${isCrit ? 'text-danger' : 'text-safe'}`}>
                  {risk.toFixed(1)}%
                </span>
              </div>
              <div className="tile-metric-col">
                <span className="tile-m-k">Duration</span>
                <span className="tile-m-v mono-metric">{dur}</span>
              </div>
              <div className="tile-metric-col">
                <span className="tile-m-k">Date</span>
                <span className="tile-m-v mono-metric text-xs">
                  {rec.created_at ? new Date(rec.created_at).toLocaleDateString() : 'Recent'}
                </span>
              </div>
            </div>

            <div className="tile-footer">
              <span className="mono-metric text-xs text-dim">
                ID: {(rec.analysis_id || rec.id || `REC-${idx + 1}`).substring(0, 14)}
              </span>
              <div className="tile-inspect-link">
                <span>Inspect</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default HistoryTileView;

