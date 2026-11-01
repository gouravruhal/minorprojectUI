import React from 'react';
import { BarChart3, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import './ForensicAnalysisView.css';

export function ForensicComparisonGraph({ intervals = [], comparisonMetrics = {} }) {
  const metricsList = Object.values(comparisonMetrics);

  return (
    <div className="comparison-section-card card animate-fade-in">
      {/* 1. WHERE: 5-Second Timeline Interval Risk Breakdown */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={17} style={{ color: 'var(--accent-blue)' }} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 700 }}>
              Timeline Risk Trajectory (5-Second Slices)
            </h3>
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            {intervals.length} consecutive parts evaluated
          </span>
        </div>

        <div className="timeline-intervals-row custom-scrollbar">
          {intervals.map((int, i) => {
            const isSynth = int.is_synthetic || int.synthetic_probability >= 52;
            const synthProb = int.synthetic_probability;
            const humanProb = int.human_probability || Math.round(100 - synthProb);

            return (
              <div key={i} className={`interval-box-card ${isSynth ? 'anomaly' : 'human'}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--text-main)' }}>
                    {int.time_range}
                  </span>
                  <span style={{
                    fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: 4, fontWeight: 700,
                    background: isSynth ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                    color: isSynth ? '#dc2626' : 'var(--accent-green)'
                  }}>
                    {isSynth ? 'AI RISK' : 'HUMAN'}
                  </span>
                </div>

                <div style={{ margin: '0.35rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 3 }}>
                    <span>AI: {synthProb}%</span>
                    <span>Human: {humanProb}%</span>
                  </div>
                  <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: 'var(--bg-inset)', boxShadow: 'var(--shadow-clay-inset)' }}>
                    <div style={{ width: `${synthProb}%`, background: '#ef4444', transition: 'width 0.4s ease' }} />
                    <div style={{ width: `${humanProb}%`, background: '#10b981', transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  Jitter: {int.jitter_ppq}% • HNR: {int.hnr_db}dB
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. WHY: Comparative Biomechanical Baseline Analysis */}
      {metricsList.length > 0 && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <Activity size={17} style={{ color: 'var(--accent-green)' }} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 700 }}>
              Acoustic Biomechanical Diagnostic Matrix
            </h3>
          </div>

          <div className="comparative-biometric-grid">
            {metricsList.map((m, idx) => (
              <div key={idx} className={`biometric-metric-card ${m.is_anomaly ? 'alert' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-main)' }}>{m.name}</span>
                  {m.is_anomaly ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', color: '#dc2626' }}>
                      <AlertCircle size={12} /> Anomaly
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', color: 'var(--accent-green)' }}>
                      <CheckCircle size={12} /> Normal
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.4rem 0' }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'monospace', color: m.is_anomaly ? '#ef4444' : '#10b981' }}>
                    {m.detected} {m.unit}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Detected</span>
                </div>

                <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                  <div>• Human Baseline: <span style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>{m.human_norm}</span></div>
                  <div>• Synthetic Threshold: <span style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>{m.ai_norm}</span></div>
                </div>
                <div style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {m.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
