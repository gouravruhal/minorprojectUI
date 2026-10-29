import React, { useState } from 'react';
import { Mic, Square } from 'lucide-react';
import './MicrophoneIngress.css';

export function MicrophoneIngressPanel({
  isStreaming,
  streamMode,
  onStartStream,
  onStopStream,
  liveResult,
  micVolume = 0,
  elapsedSeconds = 0,
  formatCallTimer
}) {
  const [consentGranted, setConsentGranted] = useState(true);
  const isMicActive = isStreaming && streamMode === 'mic';

  return (
    <div className="mic-section-card card animate-fade-in" id="microphone-ingress-section">
      <div className="mic-section-header">
        <div className="mic-header-title-group">
          <h3 className="mic-section-title">Laptop Microphone Analysis</h3>
          <span className="mic-section-sub">Direct local microphone capture (does not capture remote cellular calls)</span>
        </div>
        <div className="mic-header-badge-group">
          {isMicActive ? (
            <span className="status-badge connected">
              <span className="sim-pulse-dot" />
              <span>STREAMING AUDIO</span>
            </span>
          ) : (
            <span className="status-badge standby">
              <span className="standby-dot" />
              <span>MICROPHONE STANDBY</span>
            </span>
          )}
        </div>
      </div>

      <div className={`mic-stage-box ${isMicActive ? 'recording-active' : ''}`}>
        <div className="mic-stage-left">
          <div className={`mic-ring-radar ${isMicActive ? 'recording' : ''}`}>
            <Mic size={24} className={isMicActive ? 'text-orange' : 'text-dim'} />
          </div>

          <div className="mic-meta-details">
            <h4 className="mic-state-title">
              {isMicActive ? `Active Recording • ${formatCallTimer ? formatCallTimer(elapsedSeconds) : `${elapsedSeconds}s`}` : 'Standard Web Audio API Ready'}
            </h4>
            <div className="mic-vu-row">
              <div className="mic-vu-track">
                <div className="mic-vu-bar" style={{ width: `${isMicActive ? Math.max(8, micVolume) : 4}%` }} />
              </div>
              <span className="mic-vu-label">{isMicActive ? `${micVolume}% Level` : '0%'}</span>
            </div>
          </div>
        </div>

        <div className="mic-stage-actions">
          {!isMicActive ? (
            <button
              id="mic-start-capture-btn"
              className={`btn-primary pulse-attention ${!consentGranted ? 'disabled' : ''}`}
              onClick={() => onStartStream('mic')}
              disabled={!consentGranted}
              type="button"
            >
              <Mic size={15} />
              <span>Start Microphone</span>
            </button>
          ) : (
            <button id="mic-stop-capture-btn" className="btn-danger" onClick={onStopStream} type="button">
              <Square size={15} />
              <span>Stop Microphone</span>
            </button>
          )}
        </div>
      </div>

      <div className="mic-consent-strip">
        <label className="mic-consent-label">
          <input
            type="checkbox"
            checked={consentGranted}
            onChange={(e) => setConsentGranted(e.target.checked)}
          />
          <span>I consent to real-time local microphone audio capture and backend AI authenticity inspection.</span>
        </label>
      </div>

      {isMicActive && liveResult && (
        <div className="mic-live-metrics-panel animate-fade-in">
          <div className="live-metric-pill">
            <span className="metric-pill-label">CLASSIFICATION</span>
            <span className={`metric-pill-val ${liveResult.is_synthetic ? 'text-danger' : 'text-safe'}`}>
              {liveResult.label || 'Analyzing...'}
            </span>
          </div>
          <div className="live-metric-pill">
            <span className="metric-pill-label">CONFIDENCE</span>
            <span className="metric-pill-val mono-metric">{Math.round((liveResult.confidence || 0.5) * 100)}%</span>
          </div>
          <div className="live-metric-pill">
            <span className="metric-pill-label">LATENCY</span>
            <span className="metric-pill-val mono-metric">{liveResult.processing_time_ms || 24}ms</span>
          </div>
          {liveResult.metrics?.jitter_ppq !== undefined && (
            <div className="live-metric-pill">
              <span className="metric-pill-label">JITTER</span>
              <span className="metric-pill-val mono-metric">{liveResult.metrics.jitter_ppq}%</span>
            </div>
          )}
          {liveResult.metrics?.shimmer_apq !== undefined && (
            <div className="live-metric-pill">
              <span className="metric-pill-label">SHIMMER</span>
              <span className="metric-pill-val mono-metric">{liveResult.metrics.shimmer_apq}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
