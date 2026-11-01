import React from 'react';
import { ExternalLink, ShieldAlert, ShieldCheck, Clock, FileAudio } from 'lucide-react';

export function HistoryListView({ records = [], onSelectRecord }) {
  if (records.length === 0) {
    return (
      <div className="empty-history-box text-dim text-sm clay-inset">
        Database is currently empty and initialized for testing. Upload an audio recording under &quot;Recording Analysis&quot; or speak into your mic under &quot;Microphone Analysis&quot; to generate live forensic database records!
      </div>
    );
  }

  return (
    <div className="history-list-container clay-inset">
      <table className="history-table">
        <thead>
          <tr>
            <th>Recording / Call</th>
            <th>Ingress ID</th>
            <th>Date & Time</th>
            <th>Duration</th>
            <th>Risk Score</th>
            <th>Threat Tier</th>
            <th>Action Protocol</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {records.map((rec, idx) => {
            const risk = Number(rec.riskScore ?? rec.synthetic_probability ?? 10);
            const isCrit = risk >= 70 || rec.threatTier === 'CRITICAL' || rec.label === 'CRITICAL';
            const tier = rec.threatTier || rec.label || (risk >= 70 ? 'CRITICAL' : risk >= 45 ? 'ELEVATED' : 'LOW');
            const action = rec.action || rec.recommended_action || (isCrit ? 'TRIGGER_MFA' : 'CONTINUE_MONITORING');

            return (
              <tr key={idx} className={isCrit ? 'history-row-alert' : ''}>
                <td>
                  <div className="flex-center gap-2">
                    <FileAudio size={16} className="text-accent" />
                    <div>
                      <div className="font-bold text-sm text-main">{rec.filename || rec.title}</div>
                      <div className="text-xs text-dim">{rec.callerName || 'Standard Caller'}</div>
                    </div>
                  </div>
                </td>
                <td className="mono-metric text-xs text-dim">
                  {rec.analysis_id || rec.id || `REC-${idx + 1}`}
                </td>
                <td className="mono-metric text-xs">
                  {rec.created_at ? new Date(rec.created_at).toLocaleString() : rec.timestamp || 'Recent'}
                </td>
                <td className="mono-metric text-xs">{rec.duration || `${rec.duration_seconds || 4.0}s`}</td>
                <td>
                  <span className={`mono-metric font-bold text-sm ${isCrit ? 'text-danger' : 'text-safe'}`}>
                    {risk.toFixed(1)}%
                  </span>
                </td>
                <td>
                  <span className={`badge ${isCrit ? 'badge-danger' : 'badge-safe'}`}>
                    {tier}
                  </span>
                </td>
                <td className="mono-metric text-xs text-accent">{action}</td>
                <td>
                  <button
                    type="button"
                    className="btn-open-report-chip"
                    onClick={() => onSelectRecord(rec)}
                  >
                    <span>View Report</span>
                    <ExternalLink size={12} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default HistoryListView;

