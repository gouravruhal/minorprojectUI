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
          <span className="step-title">Connect Phone to Laptop</span>
          <span className="step-desc">Bluetooth Audio / Line-In / Mic</span>
        </div>
      </div>

      <ChevronRight size={14} className="step-flow-arrow" aria-hidden="true" />

      <div className="step-node-item">
        <span className="step-num-pill">2</span>
        <div className="step-node-content">
          <span className="step-title">Keep Live Call Active</span>
          <span className="step-desc">Call active with remote phone</span>
        </div>
      </div>

      <ChevronRight size={14} className="step-flow-arrow" aria-hidden="true" />

      <div className="step-node-item">
        <span className="step-num-pill">3</span>
        <div className="step-node-content">
          <span className="step-title">Record & Analyze</span>
          <span className="step-desc">Click Connect Live Call</span>
        </div>
      </div>
    </div>
  );
}
