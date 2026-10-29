import React from 'react';
import { Smartphone, Mic, Volume2, AlertTriangle } from 'lucide-react';
import { COUNTRY_CODES } from './voiceAnalysisConstants';
import { TelecomSourceExplainer } from './TelecomSourceExplainer';
import { TelecomConsentNotice } from './TelecomConsentNotice';
import { SavedCallRecordingCard } from './SavedCallRecordingCard';
import './CarrierHero.css';

export function CarrierConnectionHero({
  connectionState = 'disconnected',
  selectedSource = 'laptop_microphone',
  onSelectSource,
  userConsent = false,
  onToggleConsent,
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
  onResetCall,
  errorMessage,
  troubleshooting
}) {
  const getStatusBadge = () => {
    switch (connectionState) {
      case 'connecting':
        return <span className="status-badge connecting"><span className="sim-pulse-dot" /><span>CONNECTING...</span></span>;
      case 'connected':
      case 'streaming_audio':
        return <span className="status-badge connected"><span className="sim-pulse-dot" /><span>STREAMING AUDIO</span></span>;
      case 'awaiting_consent':
        return <span className="status-badge warning"><span className="standby-dot" /><span>AWAITING CONSENT</span></span>;
      case 'error':
        return <span className="status-badge danger"><span className="standby-dot" /><span>CONNECTION ERROR</span></span>;
      default:
        return <span className="status-badge standby"><span className="standby-dot" /><span>DISCONNECTED</span></span>;
    }
  };

  return (
    <div className="telephony-entrance-card animate-fade-in" id="telephony-ingress-container">
      <div className="entrance-header-row">
        <div className="entrance-label-group">
          <h3 className="telephony-feature-heading">Telecom Live Analysis</h3>
          <span className="telephony-feature-sub">Live telephone conversation audio stream inspection</span>
        </div>
        <div className="wireless-indicator-badge">{getStatusBadge()}</div>
      </div>

      <TelecomSourceExplainer selectedSource={selectedSource} onSelectSource={onSelectSource} />

      <div className="telecom-setup-grid">
        <div className="telecom-input-block">
          <label className="telecom-field-label" htmlFor="sim-phone-number-input">Remote Caller Phone Number</label>
          <div className="phone-input-wrapper">
            <div className="country-code-select-wrap">
              <select id="country-code-select" className="country-code-dropdown" value={selectedCountryCode} onChange={onCountryCodeChange} aria-label="Country Code">
                {COUNTRY_CODES.map((item) => (
                  <option key={item.code} value={item.code}>{item.flag} {item.code} ({item.country})</option>
                ))}
              </select>
            </div>
            <input id="sim-phone-number-input" type="tel" className="telephony-number-input mono-metric" value={phoneNumberDigits} onChange={onPhoneNumberDigitsChange} placeholder="Enter remote caller number..." aria-label="Phone Number" />
          </div>
        </div>

        {selectedSource !== 'twilio_provider' && (
          <div className="telecom-input-block">
            <label className="telecom-field-label" htmlFor="audio-gateway-select">
              <Mic size={13} style={{ display: 'inline', marginRight: 4 }} />
              Audio Input Device (Speakerphone / Interface)
            </label>
            <div className="gateway-select-row">
              <select id="audio-gateway-select" className="audio-gateway-dropdown" value={selectedAudioDeviceId} onChange={(e) => onSelectAudioDevice(e.target.value)} aria-label="Audio Gateway Input">
                {audioDevices.length === 0 ? (
                  <option value="">Default Audio Input</option>
                ) : (
                  audioDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
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
        )}
      </div>

      <TelecomConsentNotice consentGranted={userConsent} onToggleConsent={onToggleConsent} />

      {errorMessage && (
        <div className="telecom-error-banner animate-fade-in">
          <AlertTriangle size={15} className="text-danger" />
          <div className="error-text-wrap">
            <span className="error-title">{errorMessage}</span>
            {troubleshooting && <span className="error-sub">{troubleshooting}</span>}
          </div>
        </div>
      )}

      <div className="entrance-connect-bar">
        <button id="connect-and-record-btn" className={`btn-connect-wireless ${!userConsent ? 'disabled' : ''}`} onClick={onStartLiveCall} disabled={!userConsent} type="button">
          <Smartphone size={16} />
          <span>Connect & Start Live Analysis</span>
        </button>
      </div>

      {savedRecording && (
        <SavedCallRecordingCard recording={savedRecording} onAnalyzeRecording={onAnalyzeRecording} onResetCall={onResetCall} />
      )}
    </div>
  );
}
