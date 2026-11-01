import React from 'react';
import { Activity, Clock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

export function MicSessionTimelineChart({ logs = [], isStreaming, durationSec = 0 }) {
  if (logs.length === 0) return null;

  // Chronological order (oldest to newest)
  const chronoLogs = [...logs].reverse();
  const scores = chronoLogs.map((l) => Number(l.riskScore || 0));
  const peakScore = scores.length > 0 ? Math.max(...scores) : 0;
  const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
  const isHighRisk = peakScore >= 70;

  return (
    <div className="mic-timeline-chart-card card clay-card animate-fade-in">
      <div className="panel-header-row">
        <div className="panel-title-group">
          <Activity size={18} className="text-accent" />
          <div>
            <h3 className="panel-heading">Continuous Session Risk Trajectory</h3>
            <span className="mono-metric text-dim text-xs">
              Recording Duration: {durationSec > 0 ? `${durationSec.toFixed(1)}s` : `${chronoLogs.length * 2}s`} • {chronoLogs.length} Continuous 2.0s Windows
            </span>
          </div>
        </div>

        <div className="flex-center gap-2">
          <span className="mono-metric text-xs badge badge-neutral">
            Avg: {avgScore}%
          </span>
          <span className={`badge ${isHighRisk ? 'badge-danger' : 'badge-safe'}`}>
            Peak: {peakScore}%
          </span>
        </div>
      </div>

      <div className="trajectory-bars-container clay-inset">
        <div className="trajectory-bars-scroll">
          {chronoLogs.map((item, idx) => {
            const risk = Number(item.riskScore || 0);
            const isCrit = risk >= 70;
            const isElev = risk >= 45 && !isCrit;
            const color = isCrit ? 'var(--danger-red)' : isElev ? 'var(--accent-yellow)' : 'var(--safe-green)';
            const barHeight = Math.max(12, Math.round((risk / 100) * 85));

            return (
              <div key={idx} className="trajectory-bar-col">
                <span className="bar-score-label mono-metric text-xs" style={{ color }}>
                  {risk}%
                </span>
                <div className="bar-track-vertical">
                  <div
                    className="bar-fill-vertical"
                    style={{ height: `${barHeight}%`, background: color }}
                  />
                </div>
                <span className="bar-time-label mono-metric text-xs text-dim">
                  T+{item.timestampSec}s
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="trajectory-footer-meta">
        <div className="flex-center gap-1 text-xs text-dim">
          <Clock size={12} />
          <span>Continuous multi-segment recording actively evaluating phone voice clones or local phonation.</span>
        </div>
        <div className="flex-center gap-2">
          <span className="badge badge-safe text-xs flex-center gap-1">
            <CheckCircle size={10} />
            <span>&lt;45% Human</span>
          </span>
          <span className="badge badge-danger text-xs flex-center gap-1">
            <AlertTriangle size={10} />
            <span>&ge;70% Synthetic Alert</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default MicSessionTimelineChart;

