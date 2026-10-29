import React from 'react';
import { Mic, Square } from 'lucide-react';
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
        <h3 className="mic-section-title">Live Microphone Capture</h3>

        <div>
          {isMicActive ? (
            <span className="status-badge connected">
              <span className="sim-pulse-dot" />
              <span>LIVE STREAMING</span>
            </span>
          ) : (
            <span className="status-badge standby">
              <span className="standby-dot" />
              <span>STANDBY</span>
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
              {isMicActive ? 'Microphone Active • Live Stream Running' : 'Device Microphone Ready'}
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
              <span>Start Microphone Capture</span>
            </button>
          ) : (
            <button
              id="mic-stop-capture-btn"
              className="btn-danger"
              onClick={onStopStream}
            >
              <Square size={15} />
              <span>Stop Capture</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
