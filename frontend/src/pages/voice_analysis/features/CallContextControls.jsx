import React from 'react';
import { ShieldAlert, Zap, Globe, Sliders } from 'lucide-react';
import './CallContextControls.css';

export function CallContextControls({
  context,
  onContextChange,
  onSimulate20sCall,
  isAnalyzing
}) {
  const handleChange = (field, value) => {
    onContextChange?.({ ...context, [field]: value });
  };

  return (
    <div className="call-context-card card animate-fade-in">
      <div className="call-context-header">
        <div className="context-title-wrap">
          <Sliders size={16} style={{ color: 'var(--accent-blue)' }} />
          <span className="context-title">Call Security Context & Splicing Simulation</span>
        </div>
        <span className="context-subtext">Dynamic Risk Weighting</span>
      </div>

      <div className="context-inputs-row">
        {/* Transaction Sensitivity */}
        <div className="context-field">
          <label>Transaction Sensitivity</label>
          <select
            value={context.transactionSensitivity || 'high'}
            onChange={(e) => handleChange('transactionSensitivity', e.target.value)}
            disabled={isAnalyzing}
          >
            <option value="low">Low (General Query)</option>
            <option value="medium">Medium (Account Inquiry)</option>
            <option value="high">High (Wire Transfer / OTP)</option>
            <option value="critical">Critical (Immediate Fund Exfil)</option>
          </select>
        </div>

        {/* Caller Trust Level */}
        <div className="context-field">
          <label>Caller Trust Level</label>
          <select
            value={context.callerTrustLevel || 'standard'}
            onChange={(e) => handleChange('callerTrustLevel', e.target.value)}
            disabled={isAnalyzing}
          >
            <option value="trusted">Trusted / Biometric Enrolled</option>
            <option value="standard">Standard KYC Subscriber</option>
            <option value="suspicious">Suspicious / Flagged Caller</option>
          </select>
        </div>

        {/* VoIP / Unusual Location Flag */}
        <div className="context-field-checkbox">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={Boolean(context.unusualLocationOrVoipFlag)}
              onChange={(e) => handleChange('unusualLocationOrVoipFlag', e.target.checked)}
              disabled={isAnalyzing}
            />
            <Globe size={14} style={{ color: 'var(--accent-green)' }} />
            <span>VoIP / Unknown Route</span>
          </label>
        </div>

        {/* 20s Spliced Attack Simulation Button */}
        <div className="context-action-col">
          <button
            type="button"
            className="btn-simulate-splice"
            disabled={isAnalyzing}
            onClick={onSimulate20sCall}
            title="Simulate 20-second call with mid-call deepfake splice injection"
          >
            <Zap size={14} />
            <span>Simulate 20s Spliced Attack</span>
          </button>
        </div>
      </div>
    </div>
  );
}
export default CallContextControls;

