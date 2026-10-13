import React from 'react';
import { Smartphone, RotateCcw } from 'lucide-react';
import './ConnectionEstablishment.css';

export function ConnectionEstablishmentScreen({
  enteredNumber,
  enteredName,
  network,
  handshakeStep,
  onCancel
}) {
  const progressPercent = handshakeStep === 1 ? '25%' : handshakeStep === 2 ? '55%' : handshakeStep === 3 ? '85%' : '100%';

  return (
    <div className="establishment-screen-card animate-fade-in" id="connection-establishment-panel">
      <div className="establishment-header-row">
        <div className="establishment-target-group">
          <div className="establishment-radar-ring">
            <div className="establishment-radar-pulse" />
            <Smartphone size={24} className="text-orange" />
          </div>
          <div className="establishment-titles">
            <h3 className="establishment-heading">
              Establishing Wireless Link to <strong>{enteredNumber}</strong>
            </h3>
            <p className="establishment-sub">
              Bridging live carrier audio trunk ({network || 'VoLTE'}) for neural vocoder inspection...
            </p>
          </div>
        </div>

        <button className="btn-secondary" onClick={onCancel} style={{ fontSize: '0.78rem', padding: '6px 14px' }}>
          <RotateCcw size={12} />
          <span>Cancel Link</span>
        </button>
      </div>

      <div className="establishment-progress-track">
        <div className="establishment-progress-fill" style={{ width: progressPercent }} />
      </div>

      <div className="establishment-milestones-grid">
        <div className={`milestone-item ${handshakeStep > 1 ? 'done' : handshakeStep === 1 ? 'active' : ''}`}>
          <span className="milestone-dot">{handshakeStep > 1 ? '✓' : '1'}</span>
          <div className="milestone-text">
            <span className="milestone-title">Radio Carrier Link</span>
            <span className="milestone-desc">Securing RF duplex channel</span>
          </div>
        </div>

        <div className={`milestone-item ${handshakeStep > 2 ? 'done' : handshakeStep === 2 ? 'active' : ''}`}>
          <span className="milestone-dot">{handshakeStep > 2 ? '✓' : '2'}</span>
          <div className="milestone-text">
            <span className="milestone-title">Identity Registry</span>
            <span className="milestone-desc">{enteredName || 'Aadhaar Verified'}</span>
          </div>
        </div>

        <div className={`milestone-item ${handshakeStep > 3 ? 'done' : handshakeStep === 3 ? 'active' : ''}`}>
          <span className="milestone-dot">{handshakeStep > 3 ? '✓' : '3'}</span>
          <div className="milestone-text">
            <span className="milestone-title">Audio Capture Buffer</span>
            <span className="milestone-desc">16kHz linear PCM buffer</span>
          </div>
        </div>

        <div className={`milestone-item ${handshakeStep >= 4 ? 'done' : ''}`}>
          <span className="milestone-dot">{handshakeStep >= 4 ? '✓' : '4'}</span>
          <div className="milestone-text">
            <span className="milestone-title">Ready for AI</span>
            <span className="milestone-desc">Telemetry bridge locked</span>
          </div>
        </div>
      </div>

      <div className="establishment-bottom-row">
        <span className="establishment-badge-status">
          PHASE {handshakeStep} OF 4 • {handshakeStep < 4 ? 'ESTABLISHING HANDSHAKE' : 'CONNECTION SYNCHRONIZED'}
        </span>
        <span className="badge badge-neutral">AMR-WB 16kHz PCM</span>
      </div>
    </div>
  );
}
