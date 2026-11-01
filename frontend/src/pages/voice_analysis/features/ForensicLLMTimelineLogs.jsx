import React, { useState } from 'react';
import { Sparkles, Terminal, Copy, Check, ShieldAlert } from 'lucide-react';
import './ForensicAnalysisView.css';

export function ForensicLLMTimelineLogs({ llmExplanation }) {
  const [filter, setFilter] = useState('all');
  const [copied, setCopied] = useState(false);

  if (!llmExplanation) return null;

  const logs = llmExplanation.timeline_logs || [];
  const filteredLogs = logs.filter((l) => {
    if (filter === 'ai') return l.synthetic_probability >= 52;
    if (filter === 'human') return l.synthetic_probability <= 48;
    return true;
  });

  const handleCopy = () => {
    navigator.clipboard?.writeText(JSON.stringify(llmExplanation, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="llm-forensic-box card animate-fade-in">
      {/* 1. Hugging Face & Production Forensic LLM Assessment */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Sparkles size={18} style={{ color: 'var(--accent-yellow)' }} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 700 }}>
              AI Acoustic Forensic Assessment
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', background: 'var(--bg-inset)', color: 'var(--accent-blue)', border: '1px solid var(--border-subtle)', padding: '0.2rem 0.6rem', borderRadius: 12 }}>
              {llmExplanation.model || 'Qwen/Qwen2.5-0.5B-Instruct'}
            </span>
            <span style={{
              fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: 12, fontWeight: 700,
              background: llmExplanation.threat_tier === 'CRITICAL' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
              color: llmExplanation.threat_tier === 'CRITICAL' ? '#dc2626' : 'var(--accent-green)'
            }}>
              THREAT: {llmExplanation.threat_tier || 'MINIMAL'}
            </span>
          </div>
        </div>

        <div className="llm-summary-content">
          <div style={{ whiteSpace: 'pre-line' }}>{llmExplanation.summary}</div>
          {llmExplanation.recommendation && (
            <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <ShieldAlert size={15} style={{ color: 'var(--accent-yellow)', flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: '0.82rem', color: 'var(--accent-yellow)', fontWeight: 700 }}>
                Protocol: {llmExplanation.recommendation}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Chronological 5-Second Interval Forensic Timeline Logs */}
      {logs.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal size={16} style={{ color: 'var(--accent-blue)' }} />
              <h4 style={{ margin: 0, fontSize: '0.98rem', color: 'var(--text-main)', fontWeight: 700 }}>
                5-Second Interval Forensic Logs ({filteredLogs.length})
              </h4>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <button
                className={`btn-filter ${filter === 'all' ? 'active' : ''}`}
                style={{ fontSize: '0.74rem', padding: '0.25rem 0.55rem', borderRadius: 6, background: filter === 'all' ? 'var(--clay-gradient)' : 'var(--bg-inset)', color: filter === 'all' ? '#fff' : 'var(--text-dim)', border: '1px solid var(--border-subtle)', cursor: 'pointer', boxShadow: 'var(--shadow-clay)' }}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`btn-filter ${filter === 'ai' ? 'active' : ''}`}
                style={{ fontSize: '0.74rem', padding: '0.25rem 0.55rem', borderRadius: 6, background: filter === 'ai' ? '#ef4444' : 'var(--bg-inset)', color: filter === 'ai' ? '#fff' : 'var(--text-dim)', border: '1px solid var(--border-subtle)', cursor: 'pointer', boxShadow: 'var(--shadow-clay)' }}
                onClick={() => setFilter('ai')}
              >
                AI Flags
              </button>
              <button
                className={`btn-filter ${filter === 'human' ? 'active' : ''}`}
                style={{ fontSize: '0.74rem', padding: '0.25rem 0.55rem', borderRadius: 6, background: filter === 'human' ? '#10b981' : 'var(--bg-inset)', color: filter === 'human' ? '#fff' : 'var(--text-dim)', border: '1px solid var(--border-subtle)', cursor: 'pointer', boxShadow: 'var(--shadow-clay)' }}
                onClick={() => setFilter('human')}
              >
                Human
              </button>
              <button
                onClick={handleCopy}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.74rem', padding: '0.25rem 0.55rem', borderRadius: 6, background: 'var(--bg-inset)', color: 'var(--text-dim)', border: '1px solid var(--border-subtle)', cursor: 'pointer', marginLeft: '0.25rem', boxShadow: 'var(--shadow-clay)' }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="timeline-logs-feed">
            {filteredLogs.map((logItem, idx) => {
              const isSynth = logItem.synthetic_probability >= 52;
              return (
                <div key={idx} className={`timeline-log-entry ${isSynth ? 'anomaly' : 'human'}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-main)' }}>
                      [{logItem.time_range}]
                    </span>
                    <span style={{ fontSize: '0.72rem', color: isSynth ? '#dc2626' : 'var(--accent-green)', fontWeight: 700 }}>
                      {logItem.status} ({logItem.synthetic_probability}% AI Risk)
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                    {logItem.diagnostic_text}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '0.35rem' }}>
                    {logItem.telemetry}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
