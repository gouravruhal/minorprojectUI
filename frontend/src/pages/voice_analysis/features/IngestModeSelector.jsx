import React from 'react';
import { PhoneCall, Mic, FileAudio } from 'lucide-react';
import './IngestModeSelector.css';

export function IngestModeSelector({ ingestMode, onSelectMode, isStreaming, onStopStream }) {
  const handleSelect = (mode) => {
    if (mode === ingestMode) return;
    if (isStreaming && onStopStream) {
      onStopStream();
    }
    onSelectMode(mode);
  };

  return (
    <div className="ingress-mode-nav card" id="ingress-mode-nav">
      <div className="mode-tabs-grid" role="tablist" aria-label="Audio Ingress Modes">
        <button
          id="mode-btn-preset"
          role="tab"
          aria-selected={ingestMode === 'preset'}
          className={`mode-tab-item ${ingestMode === 'preset' ? 'active' : ''}`}
          onClick={() => handleSelect('preset')}
        >
          <div className="mode-tab-icon">
            <PhoneCall size={18} />
          </div>
          <div className="mode-tab-content">
            <span className="mode-tab-title">Telecom Presets</span>
            <span className="mode-tab-subtitle">Connect Live Call</span>
          </div>
        </button>

        <button
          id="mode-btn-mic"
          role="tab"
          aria-selected={ingestMode === 'mic'}
          className={`mode-tab-item ${ingestMode === 'mic' ? 'active' : ''}`}
          onClick={() => handleSelect('mic')}
        >
          <div className="mode-tab-icon">
            <Mic size={18} />
          </div>
          <div className="mode-tab-content">
            <span className="mode-tab-title">Live Microphone</span>
            <span className="mode-tab-subtitle">Device Microphone</span>
          </div>
        </button>

        <button
          id="mode-btn-upload"
          role="tab"
          aria-selected={ingestMode === 'upload'}
          className={`mode-tab-item ${ingestMode === 'upload' ? 'active' : ''}`}
          onClick={() => handleSelect('upload')}
        >
          <div className="mode-tab-icon">
            <FileAudio size={18} />
          </div>
          <div className="mode-tab-content">
            <span className="mode-tab-title">Recording</span>
            <span className="mode-tab-subtitle">Analyze Recording</span>
          </div>
        </button>
      </div>
    </div>
  );
}
