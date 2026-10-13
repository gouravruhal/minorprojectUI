import React from 'react';
import { ChevronRight } from 'lucide-react';
import './ConnectionStepsHint.css';

export function ConnectionStepsHint({ wirelessStatus }) {
  if (wirelessStatus !== 'idle') return null;

  return (
    <div className="steps-guide-card" id="connection-steps-guide">
      <div className="step-node-item">
        <span className="step-num-pill">1</span>
        <div className="step-node-content">
          <span className="step-title">Enable VoLTE / HD Voice</span>
          <span className="step-desc">Mobile Network & Wi-Fi Calling</span>
        </div>
      </div>

      <ChevronRight size={14} className="step-flow-arrow" aria-hidden="true" />

      <div className="step-node-item">
        <span className="step-num-pill">2</span>
        <div className="step-node-content">
          <span className="step-title">Turn on Audio Tethering</span>
          <span className="step-desc">Bluetooth / Wireless Gateway</span>
        </div>
      </div>

      <ChevronRight size={14} className="step-flow-arrow" aria-hidden="true" />

      <div className="step-node-item">
        <span className="step-num-pill">3</span>
        <div className="step-node-content">
          <span className="step-title">Keep Live Call Active</span>
          <span className="step-desc">Then click Connect Device</span>
        </div>
      </div>
    </div>
  );
}
