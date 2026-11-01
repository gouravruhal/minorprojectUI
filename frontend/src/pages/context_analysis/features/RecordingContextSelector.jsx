import React from 'react';
import { Mic, CheckCircle2, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';

export function RecordingContextSelector({
  recordings = [],
  selectedId,
  onSelectRecording,
  onRegenerateContext,
  isRegenerating
}) {
  const current = recordings.find((r) => r.id === selectedId) || recordings[0] || {};
  const isDanger = current.acousticRiskScore >= 70 || current.voiceSwapDetected;

  return (
    <div className="recording-context-selector-card card clay-card">
      <div className="selector-top-row">
        <div className="selector-info-group">
          <div className="selector-icon-bubble">
            <Mic size={18} className="text-accent" />
          </div>
          <div>
            <h3 className="selector-title">Analyzed Voice Recording Ingress</h3>
            <p className="selector-subtitle">
              Select a recording from Voice Analysis to evaluate Speech-to-Text transcript and linguistic risk.
            </p>
          </div>
        </div>

        <button
          className="btn-clay-secondary"
          onClick={onRegenerateContext}
          disabled={isRegenerating}
          title="Re-run Speech-to-Text & Linguistic Threat Extraction"
        >
          <RefreshCw size={14} className={isRegenerating ? 'animate-spin' : ''} />
          <span>{isRegenerating ? 'Transcribing...' : 'Re-Generate Context'}</span>
        </button>
      </div>

      <div className="recordings-picker-strip">
        <label className="picker-label">Active Audio Source:</label>
        <div className="recording-pills-scroll">
          {recordings.map((rec) => {
            const isSelected = rec.id === selectedId;
            const recDanger = rec.acousticRiskScore >= 70 || rec.voiceSwapDetected;
            return (
              <button
                key={rec.id}
                type="button"
                className={`recording-select-pill ${isSelected ? 'active-pill' : ''} ${recDanger ? 'pill-danger' : 'pill-safe'}`}
                onClick={() => onSelectRecording(rec.id)}
              >
                <span className={`status-dot ${recDanger ? 'dot-danger' : 'dot-safe'}`} />
                <span className="pill-name">{rec.filename || rec.title}</span>
                <span className="pill-risk-tag">{Math.round(rec.acousticRiskScore)}%</span>
              </button>
            );
          })}
        </div>
      </div>

      {current.filename && (
        <div className="selected-recording-meta-strip">
          <div className="meta-pill-item">
            <span className="meta-k">Caller Identity:</span>
            <span className="meta-v"><strong>{current.callerName}</strong></span>
          </div>
          <div className="meta-pill-item">
            <span className="meta-k">Carrier Network:</span>
            <span className="meta-v">{current.network}</span>
          </div>
          <div className="meta-pill-item">
            <span className="meta-k">Acoustic Score:</span>
            <span className={`meta-v font-bold ${isDanger ? 'text-danger' : 'text-safe'}`}>
              {current.acousticRiskScore}% ({current.threatTier})
            </span>
          </div>
          <div className="meta-pill-item">
            <span className="meta-k">Voice Swap:</span>
            <span className="meta-v">
              {current.voiceSwapDetected ? (
                <span className="badge-chip-danger"><AlertTriangle size={12} /> Detected</span>
              ) : (
                <span className="badge-chip-safe"><CheckCircle2 size={12} /> Consistent</span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecordingContextSelector;

