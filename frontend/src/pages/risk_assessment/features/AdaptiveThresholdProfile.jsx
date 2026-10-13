import React from 'react';
import { Sliders } from 'lucide-react';

export function AdaptiveThresholdProfile({ sensitivityProfile, onSelectProfile }) {
  return (
    <div className="sensitivity-selector-box">
      <div className="sensitivity-header">
        <Sliders size={15} className="text-orange" />
        <span className="sensitivity-title">Adaptive Threshold Profile</span>
      </div>
      <div className="profile-btn-group">
        <button
          className={`profile-btn ${sensitivityProfile === 'banking_strict' ? 'active' : ''}`}
          onClick={() => onSelectProfile('banking_strict')}
        >
          <span>Banking Strict (&gt;60% Freeze)</span>
        </button>
        <button
          className={`profile-btn ${sensitivityProfile === 'fintech_standard' ? 'active' : ''}`}
          onClick={() => onSelectProfile('fintech_standard')}
        >
          <span>Fintech Standard (&gt;75% Freeze)</span>
        </button>
        <button
          className={`profile-btn ${sensitivityProfile === 'telecom_relaxed' ? 'active' : ''}`}
          onClick={() => onSelectProfile('telecom_relaxed')}
        >
          <span>Telecom Carrier (&gt;85% Warning)</span>
        </button>
      </div>
    </div>
  );
}
