import React from 'react';
import { Zap, Square, PhoneOff, Clock, Volume2 } from 'lucide-react';
import './ConnectedProfile.css';

export function ConnectedSubscriberProfile({
  enteredNumber,
  audioSourceLabel = 'Cellular Bridge (Speakerphone)',
  deviceCallDuration,
  formatCallTimer,
  audioVolume = 0,
  isStreaming,
  onStartInspectionStream,
  onStopInspection,
  onStopAndSaveCall,
  onDisconnectDevice
}) {
  return (
    <div className="connected-device-profile-card animate-fade-in" id="connected-device-card">
      <div className="connected-main-bar">
        <div className="connected-caller-info">
          <span className="connected-live-chip">
            <span className="sim-pulse-dot pulse-danger" />
            <span>RECORDING LIVE CALL</span>
          </span>

          <div className="connected-caller-meta">
            <div className="connected-caller-name-row">
              <span className="connected-caller-name mono-metric">{enteredNumber}</span>
              <span className="connected-channel-tag">{audioSourceLabel}</span>
            </div>
          </div>
        </div>

        <div className="connected-telemetry-right">
          <div className="connected-volume-pill" title={`Audio input level: ${audioVolume}%`}>
            <Volume2 size={13} className={audioVolume > 10 ? 'text-orange' : 'text-dim'} />
            <div className="connected-vu-track">
              <div className="connected-vu-fill" style={{ width: `${audioVolume}%` }} />
            </div>
          </div>

          <div className="connected-timer-pill mono-metric">
            <Clock size={13} />
            <span>{formatCallTimer(deviceCallDuration)}</span>
          </div>
        </div>
      </div>

      <div className="connected-actions-dock">
        <div className="connected-buttons-group">
          <button
            id="stop-and-save-call-btn"
            className="btn-primary"
            onClick={onStopAndSaveCall}
            type="button"
          >
            <Square size={14} />
            <span>Stop Call & Save Recording</span>
          </button>

          {!isStreaming ? (
            <button
              id="start-ai-inspection-btn"
              className="btn-start-ai-inspection pulse-attention"
              onClick={onStartInspectionStream}
              type="button"
            >
              <Zap size={15} />
              <span>Inspect Live Audio</span>
            </button>
          ) : (
            <button
              id="stop-ai-inspection-btn"
              className="btn-stop-ai-inspection"
              onClick={onStopInspection}
              type="button"
            >
              <Square size={14} />
              <span>Stop Live Inspection</span>
            </button>
          )}

          <button
            id="banner-disconnect-btn"
            className="btn-disconnect-call"
            onClick={onDisconnectDevice}
            type="button"
            title="Hang up call without saving"
          >
            <PhoneOff size={14} />
            <span>Disconnect</span>
          </button>
        </div>
      </div>
    </div>
  );
}
