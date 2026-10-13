import React from 'react';
import { Radio, Mic, Upload } from 'lucide-react';
import './IngestModeSelector.css';

export function IngestModeSelector({ ingestMode, onSelectMode }) {
  return (
    <section className="ingress-selector-container card" id="ingress-mode-selector-card">
      <div className="ingress-selector-left">
        <div className="ingress-kicker-row">
          <span className="ingress-kicker-tag">INGRESS ARCHITECTURE</span>
          <span className="badge badge-neutral">400ms SLIDING PCM</span>
        </div>
        <h2 className="ingress-selector-title">Real-Time Inbound Voice Stream Monitoring</h2>
        <p className="ingress-selector-desc">
          Continuously buffers incoming voice streams for live neural vocoder artifact detection and synthetic phoneme analysis.
        </p>
      </div>

      <div className="definite-modes-group" role="tablist" aria-label="Ingress Stream Modes">
        <button
          id="mode-btn-preset"
          role="tab"
          aria-selected={ingestMode === 'preset'}
          className={`definite-mode-item ${ingestMode === 'preset' ? 'active' : ''}`}
          onClick={() => onSelectMode('preset')}
        >
          <div className="mode-icon-wrapper">
            <Radio size={16} />
          </div>
          <div className="mode-text-stack">
            <span className="mode-primary-label">Telecom Presets</span>
            <span className="mode-sub-badge">SIP Carrier Trunk</span>
          </div>
        </button>

        <button
          id="mode-btn-mic"
          role="tab"
          aria-selected={ingestMode === 'mic'}
          className={`definite-mode-item ${ingestMode === 'mic' ? 'active' : ''}`}
          onClick={() => onSelectMode('mic')}
        >
          <div className="mode-icon-wrapper">
            <Mic size={16} />
          </div>
          <div className="mode-text-stack">
            <span className="mode-primary-label">Live Microphone</span>
            <span className="mode-sub-badge">16kHz Direct Stream</span>
          </div>
        </button>

        <button
          id="mode-btn-upload"
          role="tab"
          aria-selected={ingestMode === 'upload'}
          className={`definite-mode-item ${ingestMode === 'upload' ? 'active' : ''}`}
          onClick={() => onSelectMode('upload')}
        >
          <div className="mode-icon-wrapper">
            <Upload size={16} />
          </div>
          <div className="mode-text-stack">
            <span className="mode-primary-label">Upload Recording</span>
            <span className="mode-sub-badge">Forensic Audio File</span>
          </div>
        </button>
      </div>
    </section>
  );
}
