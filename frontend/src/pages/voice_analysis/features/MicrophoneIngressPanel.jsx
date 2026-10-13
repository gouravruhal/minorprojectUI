import React from 'react';
import { Mic, Square, Info } from 'lucide-react';
import './MicrophoneIngress.css';

export function MicrophoneIngressPanel({
  isStreaming,
  streamMode,
  onStartStream,
  onStopStream
}) {
  const isMicActive = isStreaming && streamMode === 'mic';

  return (
    <div className="mic-section-card card animate-fade-in" id="microphone-ingress-section">
      <div className="mic-section-header">
        <div className="mic-header-titles">
          <div className="ingress-kicker-row">
            <span className="ingress-kicker-tag">DIRECT AUDIO CAPTURE</span>
            <span className="badge badge-neutral">WEB AUDIO API</span>
          </div>
          <h3 className="mic-section-title">Live Hardware Microphone Ingress</h3>
          <p className="mic-section-desc">
            Directly buffers incoming voice frames from your default audio device into the 16kHz forensic pipeline.
          </p>
        </div>

        <div>
          {isMicActive ? (
            <span className="status-badge connected">
              <span className="sim-pulse-dot" />
              <span>LIVE MIC STREAMING</span>
            </span>
          ) : (
            <span className="status-badge standby">
              <span className="standby-dot" />
              <span>HARDWARE STANDBY</span>
            </span>
          )}
        </div>
      </div>

      <div className={`mic-stage-box ${isMicActive ? 'recording-active' : ''}`}>
        <div className="mic-stage-left">
          <div className={`mic-ring-radar ${isMicActive ? 'recording' : ''}`}>
            <Mic size={26} className={isMicActive ? 'text-orange' : 'text-dim'} />
          </div>

          <div className="mic-meta-details">
            <h4 className="mic-state-title">
              {isMicActive ? 'Microphone Active • Neural Analysis Engaged' : 'System Microphone Ready for Capture'}
            </h4>
            <div className="mic-equalizer-strip" aria-hidden="true">
              {[12, 18, 8, 22, 14, 20, 6, 16, 24, 10, 18, 14, 22, 8, 16, 12].map((height, i) => (
                <span
                  key={i}
                  className="eq-bar"
                  style={{
                    height: isMicActive ? undefined : '4px',
                    animationDelay: `${(i * 0.05).toFixed(2)}s`
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          {!isMicActive ? (
            <button
              id="mic-start-capture-btn"
              className="btn-primary pulse-attention"
              onClick={() => onStartStream('mic')}
            >
              <Mic size={15} />
              <span>Start Live Voice Capture</span>
            </button>
          ) : (
            <button
              id="mic-stop-capture-btn"
              className="btn-danger"
              onClick={onStopStream}
            >
              <Square size={15} />
              <span>Stop Recording</span>
            </button>
          )}
        </div>
      </div>

      <div className="mic-instructions-card">
        <Info size={16} className="text-orange" />
        <span>
          Speak naturally into your microphone or play synthetic speech to detect vocoder artifacts, jitter/shimmer variance, and vocal tract anomalies.
        </span>
      </div>

      <div className="mic-specs-grid">
        <div className="mic-spec-tile">
          <span className="mic-spec-label">Audio Input Interface</span>
          <span className="mic-spec-value">System Default Mic</span>
        </div>
        <div className="mic-spec-tile">
          <span className="mic-spec-label">Ingress Sample Rate</span>
          <span className="mic-spec-value">16,000 Hz Linear PCM</span>
        </div>
        <div className="mic-spec-tile">
          <span className="mic-spec-label">Sliding Ring Window</span>
          <span className="mic-spec-value">400ms Sub-Window</span>
        </div>
        <div className="mic-spec-tile">
          <span className="mic-spec-label">Hardware Latency</span>
          <span className="mic-spec-value">12ms Low-Jitter</span>
        </div>
      </div>
    </div>
  );
}
