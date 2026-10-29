import React from 'react';
import { Info, Radio, Smartphone, Headphones } from 'lucide-react';
import './TelecomSourceExplainer.css';

export function TelecomSourceExplainer({ selectedSource, onSelectSource }) {
  return (
    <div className="telecom-source-explainer">
      <div className="source-intro-notice">
        <Info size={14} className="text-orange" />
        <span className="source-intro-text">
          <strong>Audio Ingress Architecture:</strong> Browser permissions cannot directly access cellular radio audio on Android. Supported paths:
        </span>
      </div>

      <div className="source-selector-row" role="radiogroup" aria-label="Select Telecom Audio Source">
        <label className={`source-option-card ${selectedSource === 'laptop_microphone' ? 'selected' : ''}`}>
          <input
            type="radio"
            name="telecomSource"
            value="laptop_microphone"
            checked={selectedSource === 'laptop_microphone'}
            onChange={() => onSelectSource('laptop_microphone')}
          />
          <div className="source-card-body">
            <div className="source-title-row">
              <Smartphone size={14} className="text-orange" />
              <span className="source-title">Speakerphone Capture</span>
            </div>
            <span className="source-desc">Capture phone speaker audio via laptop microphone</span>
          </div>
        </label>

        <label className={`source-option-card ${selectedSource === 'audio_interface' ? 'selected' : ''}`}>
          <input
            type="radio"
            name="telecomSource"
            value="audio_interface"
            checked={selectedSource === 'audio_interface'}
            onChange={() => onSelectSource('audio_interface')}
          />
          <div className="source-card-body">
            <div className="source-title-row">
              <Headphones size={14} className="text-orange" />
              <span className="source-title">External Audio Bridge</span>
            </div>
            <span className="source-desc">Hardware TRRS / USB / Bluetooth gateway</span>
          </div>
        </label>

        <label className={`source-option-card ${selectedSource === 'twilio_provider' ? 'selected' : ''}`}>
          <input
            type="radio"
            name="telecomSource"
            value="twilio_provider"
            checked={selectedSource === 'twilio_provider'}
            onChange={() => onSelectSource('twilio_provider')}
          />
          <div className="source-card-body">
            <div className="source-title-row">
              <Radio size={14} className="text-orange" />
              <span className="source-title">Twilio Media Stream</span>
            </div>
            <span className="source-desc">Cloud telephony provider WebSocket stream</span>
          </div>
        </label>
      </div>
    </div>
  );
}
