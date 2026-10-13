import React from 'react';

export function WifiSignalBox({ wifiSignalDbm, wifiPingMs, onCycleWifiTest }) {
  return (
    <div 
      className="entity-box signal-box clickable-signal-box"
      title="Live Wi-Fi Calling & Phone RF Gateway (Click to cycle signal test)"
      onClick={onCycleWifiTest}
    >
      <div className="entity-info">
        <div className="signal-label-row">
          <span className="entity-label">Wi-Fi Signal Strength</span>
          <span className="signal-live-pill mono-metric">
            <span className="wifi-beacon-dot" />
            <span>LIVE</span>
          </span>
        </div>

        <div className="wifi-symbol-in-between">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="wifi-svg-meter"
          >
            <path d="M12 20h.01" className="wifi-svg-arc arc-dot active" />
            <path d="M8.5 16.429a5 5 0 0 1 7 0" className={`wifi-svg-arc arc-1 ${wifiSignalDbm >= -88 ? 'active' : ''}`} />
            <path d="M5 12.859a10 10 0 0 1 14 0" className={`wifi-svg-arc arc-2 ${wifiSignalDbm >= -75 ? 'active' : ''}`} />
            <path d="M2 8.82a15 15 0 0 1 20 0" className={`wifi-svg-arc arc-3 ${wifiSignalDbm >= -62 ? 'active' : ''}`} />
          </svg>
        </div>

        <span className="entity-val mono-metric signal-text-val">
          {wifiSignalDbm} dBm ({wifiSignalDbm >= -58 ? 'Excellent' : wifiSignalDbm >= -72 ? 'Good' : 'Fair'}) • {wifiPingMs}ms
        </span>
      </div>
    </div>
  );
}
