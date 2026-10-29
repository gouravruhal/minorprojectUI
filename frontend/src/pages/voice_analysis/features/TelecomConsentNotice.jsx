import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';
import './TelecomConsentNotice.css';

export function TelecomConsentNotice({ consentGranted, onToggleConsent }) {
  const [showIndiaNotice, setShowIndiaNotice] = useState(false);

  return (
    <div className="telecom-consent-container">
      <div className="consent-checkbox-row">
        <label className="consent-label">
          <input
            type="checkbox"
            id="telecom-consent-checkbox"
            checked={consentGranted}
            onChange={(e) => onToggleConsent(e.target.checked)}
          />
          <span className="consent-text">
            <strong>Mandatory Consent & Authorization:</strong> I confirm that all participants in this conversation have been explicitly notified and consented to audio capture and AI voice authenticity analysis in compliance with telecommunications privacy laws.
          </span>
        </label>
      </div>

      <div className="compliance-helper-row">
        <button
          type="button"
          className="btn-compliance-link"
          onClick={() => setShowIndiaNotice(!showIndiaNotice)}
        >
          <AlertCircle size={12} className="text-orange" />
          <span>India (+91) Telecom Regulatory Policy (TRAI / DoT)</span>
          <ExternalLink size={11} />
        </button>
      </div>

      {showIndiaNotice && (
        <div className="india-compliance-callout animate-fade-in">
          <div className="callout-header">
            <ShieldCheck size={14} className="text-orange" />
            <span className="callout-title">Indian Telecom Regulatory Framework</span>
          </div>
          <p className="callout-body">
            Under Department of Telecommunications (DoT) and TRAI guidelines, direct carrier network interception of live cellular calls on personal SIM cards without verified SIP interconnection is restricted. VoiceShield AI supports legitimate acoustic speakerphone analysis, hardware interface capture, or authorized virtual DID conference streams.
          </p>
        </div>
      )}
    </div>
  );
}
