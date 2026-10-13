import React from 'react';
import { Zap, Square, PhoneOff, ShieldCheck, Clock, Wifi } from 'lucide-react';
import './ConnectedProfile.css';

export function ConnectedSubscriberProfile({
  enteredName,
  enteredNumber,
  activeCall,
  wifiSignalDbm,
  wifiPingMs,
  onCycleWifiTest,
  deviceCallDuration,
  formatCallTimer,
  isStreaming,
  onStartInspectionStream,
  onStopInspection,
  onDisconnectDevice
}) {
  return (
    <div className="connected-device-profile-card animate-fade-in" id="connected-device-card">
      <div className="connected-main-bar">
        <div className="connected-caller-info">
          <span className="connected-live-chip">
            <span className="sim-pulse-dot" />
            <span>LIVE CALL CONNECTED</span>
          </span>

          <div className="connected-caller-meta">
            <div className="connected-caller-name-row">
              <span className="connected-caller-name">{enteredName || activeCall?.callerName || 'Registered Subscriber'}</span>
              <span className="connected-kyc-tag">
                <ShieldCheck size={11} style={{ display: 'inline', marginRight: 3 }} />
                KYC Verified
              </span>
            </div>
            <div className="connected-channel-details">
              <span className="mono-metric" style={{ fontWeight: 700, color: 'var(--c-persimmon)' }}>{enteredNumber}</span>
              <span>•</span>
              <span>{activeCall?.network || 'VoLTE'}</span>
              <span>•</span>
              <span>16kHz PCM</span>
            </div>
          </div>
        </div>

        <div className="connected-telemetry-right">
          <button
            type="button"
            className="btn-outline"
            onClick={onCycleWifiTest}
            title="Wi-Fi Calling / Cellular RF Signal Gateway"
            style={{ padding: '5px 10px', fontSize: '0.75rem', gap: 6 }}
          >
            <Wifi size={13} className="text-safe" />
            <span className="mono-metric">{wifiSignalDbm || -52} dBm • {wifiPingMs || 12}ms</span>
          </button>

          <div className="connected-timer-pill mono-metric">
            <Clock size={13} />
            <span>{formatCallTimer(deviceCallDuration)}</span>
          </div>
        </div>
      </div>

      <div className="connected-actions-dock">
        <div className="connected-state-hint">
          <span className={`sim-pulse-dot ${isStreaming ? 'pulse-danger' : ''}`} />
          <span>
            {isStreaming ? 'Neural Anomaly Detection Active • 400ms Sliding Window' : 'Audio Stream Bridged • Ready for AI Voice Inspection'}
          </span>
        </div>

        <div className="connected-buttons-group">
          {!isStreaming ? (
            <button
              id="start-ai-inspection-btn"
              className="btn-start-ai-inspection pulse-attention"
              onClick={onStartInspectionStream}
              type="button"
            >
              <Zap size={15} />
              <span>Start AI Voice Inspection</span>
            </button>
          ) : (
            <button
              id="stop-ai-inspection-btn"
              className="btn-stop-ai-inspection"
              onClick={onStopInspection}
              type="button"
            >
              <Square size={14} />
              <span>Stop AI Inspection</span>
            </button>
          )}

          <button
            id="banner-disconnect-btn"
            className="btn-disconnect-call"
            onClick={onDisconnectDevice}
            type="button"
            title="Hang up live call and disconnect device"
          >
            <PhoneOff size={14} />
            <span>Disconnect Call</span>
          </button>
        </div>
      </div>
    </div>
  );
}
