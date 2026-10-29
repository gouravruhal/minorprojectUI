import React from 'react';
import { Smartphone, Mic, Volume2 } from 'lucide-react';
import { COUNTRY_CODES } from './voiceAnalysisConstants';
import { ConnectionStepsHint } from './ConnectionStepsHint';
import { SavedCallRecordingCard } from './SavedCallRecordingCard';
import './CarrierHero.css';

export function CarrierConnectionHero({
  wirelessStatus,
  selectedCountryCode,
  onCountryCodeChange,
  phoneNumberDigits,
  onPhoneNumberDigitsChange,
  audioDevices = [],
  selectedAudioDeviceId,
  onSelectAudioDevice,
  audioVolume = 0,
  savedRecording,
  onStartLiveCall,
  onAnalyzeRecording,
  onResetCall
}) {
  return (
    <div className="telephony-entrance-card animate-fade-in" id="telephony-ingress-container">
      <div className="entrance-header-row">
        <div className="entrance-label-group">
          <h3 className="telephony-feature-heading">Connect Live Call</h3>
          <span className="telephony-feature-sub">Bridge incoming phone call audio to laptop for recording & analysis</span>
        </div>

        <div className="wireless-indicator-badge">
          <span className="status-badge standby">
            <span className="standby-dot" />
            <span>GATEWAY READY</span>
          </span>
        </div>
      </div>

      <div className="telecom-setup-grid">
        <div className="telecom-input-block">
          <label className="telecom-field-label" htmlFor="sim-phone-number-input">Remote Caller Phone Number</label>
          <div className="phone-input-wrapper">
            <div className="country-code-select-wrap">
              <select
                id="country-code-select"
                className="country-code-dropdown"
                value={selectedCountryCode}
                onChange={onCountryCodeChange}
                aria-label="Country Code"
              >
                {COUNTRY_CODES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.flag} {item.code} ({item.country})
                  </option>
                ))}
              </select>
            </div>
            <input
              id="sim-phone-number-input"
              type="tel"
              className="telephony-number-input mono-metric"
              value={phoneNumberDigits}
              onChange={onPhoneNumberDigitsChange}
              placeholder="Enter remote caller number..."
              aria-label="Phone Number"
            />
          </div>
        </div>

        <div className="telecom-input-block">
          <label className="telecom-field-label" htmlFor="audio-gateway-select">
            <Mic size={13} style={{ display: 'inline', marginRight: 4 }} />
            Audio Input Source (Bluetooth / Tether / Mic)
          </label>
          <div className="gateway-select-row">
            <select
              id="audio-gateway-select"
              className="audio-gateway-dropdown"
              value={selectedAudioDeviceId}
              onChange={(e) => onSelectAudioDevice(e.target.value)}
              aria-label="Audio Gateway Input"
            >
              {audioDevices.length === 0 ? (
                <option value="">Default Audio Input (Speakerphone / Tether)</option>
              ) : (
                audioDevices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </option>
                ))
              )}
            </select>

            <div className="volume-meter-wrapper" title={`Audio input level: ${audioVolume}%`}>
              <Volume2 size={13} className={audioVolume > 10 ? 'text-orange' : 'text-dim'} />
              <div className="volume-meter-bar">
                <div className="volume-meter-fill" style={{ width: `${audioVolume}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConnectionStepsHint wirelessStatus={wirelessStatus} />

      <div className="entrance-connect-bar">
        <button
          id="connect-and-record-btn"
          className="btn-connect-wireless"
          onClick={onStartLiveCall}
          type="button"
        >
          <Smartphone size={16} />
          <span>Connect Live Call & Start Recording</span>
        </button>
      </div>

      {savedRecording && (
        <SavedCallRecordingCard
          recording={savedRecording}
          onAnalyzeRecording={onAnalyzeRecording}
          onResetCall={onResetCall}
        />
      )}
    </div>
  );
}
