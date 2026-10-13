import React from 'react';
import { Smartphone, RotateCcw, PhoneCall, PhoneOff, AlertTriangle } from 'lucide-react';
import { COUNTRY_CODES } from './voiceAnalysisConstants';
import { CarrierPresetSelector } from './CarrierPresetSelector';
import { ConnectionStepsHint } from './ConnectionStepsHint';
import './CarrierHero.css';

export function CarrierConnectionHero({
  wirelessStatus,
  selectedCountryCode,
  onCountryCodeChange,
  phoneNumberDigits,
  onPhoneNumberDigitsChange,
  onConnectDeviceClick,
  onDisconnectDevice,
  onCancelConnecting,
  onSelectPreset,
  activeCall,
  permissionDeniedMessage
}) {
  return (
    <div className="telephony-entrance-card animate-fade-in" id="telephony-ingress-container">
      <div className="entrance-header-row">
        <div className="entrance-label-group">
          <h3 className="telephony-feature-heading">
            Live Call Inspection & Number Verification
          </h3>
          <p className="telephony-feature-purpose">
            Connect any phone number to securely monitor the live audio stream and detect synthetic AI voice clones in real time.
          </p>
        </div>

        {wirelessStatus !== 'idle' && (
          <div className="wireless-indicator-badge">
            {wirelessStatus === 'connected' ? (
              <span className="status-badge connected">
                <span className="sim-pulse-dot" />
                <span>WIRELESS LINK ACTIVE</span>
              </span>
            ) : wirelessStatus === 'connecting' ? (
              <span className="status-badge connecting">
                <span className="sim-pulse-dot warning" />
                <span>ESTABLISHING RF BRIDGE...</span>
              </span>
            ) : (
              <span className="status-badge requesting">
                <span className="sim-pulse-dot warning" />
                <span>PERMISSION PENDING</span>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="number-entrance-row">
        <div className="phone-input-wrapper">
          <div className="country-code-select-wrap">
            <select
              id="country-code-select"
              className="country-code-dropdown"
              value={selectedCountryCode}
              onChange={onCountryCodeChange}
              disabled={wirelessStatus === 'connected' || wirelessStatus === 'processing'}
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
            placeholder="Enter phone number..."
            disabled={wirelessStatus === 'connected' || wirelessStatus === 'processing'}
            aria-label="Phone Number"
          />
        </div>

        <div className="entrance-actions">
          {wirelessStatus === 'idle' && (
            <button
              id="device-sim-call-btn"
              className="btn-connect-wireless"
              onClick={onConnectDeviceClick}
            >
              <Smartphone size={14} />
              <span>Connect Device</span>
            </button>
          )}

          {wirelessStatus === 'processing' && (
            <button className="btn-secondary connecting-btn" onClick={onCancelConnecting}>
              <RotateCcw size={13} className="spin-fast" />
              <span>Processing Call...</span>
            </button>
          )}

          {wirelessStatus === 'permission_prompt' && (
            <button className="btn-secondary connecting-btn" onClick={onCancelConnecting}>
              <PhoneCall size={13} />
              <span>Requesting Access...</span>
            </button>
          )}

          {wirelessStatus === 'connected' && (
            <button
              id="disconnect-device-btn"
              className="btn-danger-outline"
              onClick={onDisconnectDevice}
            >
              <PhoneOff size={14} />
              <span>Disconnect Device</span>
            </button>
          )}
        </div>
      </div>

      <ConnectionStepsHint wirelessStatus={wirelessStatus} />

      <CarrierPresetSelector
        activeCall={activeCall}
        onSelectPreset={onSelectPreset}
      />

      {permissionDeniedMessage && (
        <div className="permission-denied-alert animate-fade-in">
          <AlertTriangle size={14} className="text-danger" />
          <span>{permissionDeniedMessage}</span>
          <button className="btn-link" onClick={onConnectDeviceClick}>
            Try Connecting Again
          </button>
        </div>
      )}
    </div>
  );
}
