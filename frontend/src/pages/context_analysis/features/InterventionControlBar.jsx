import React from 'react';
import { KeyRound, Lock } from 'lucide-react';

export function InterventionControlBar({ isFrozen, onTriggerFreeze, onTriggerMfa }) {
  return (
    <div className="context-quick-actions">
      <button
        id="context-trigger-mfa-btn"
        className="btn-secondary"
        onClick={onTriggerMfa}
      >
        <KeyRound size={15} />
        <span>Step-Up Biometric Challenge</span>
      </button>
      <button
        id="context-trigger-freeze-btn"
        className={`btn-danger ${isFrozen ? 'frozen-active' : ''}`}
        onClick={onTriggerFreeze}
      >
        <Lock size={15} />
        <span>{isFrozen ? 'Account Protected (Frozen)' : 'Emergency Core Banking Freeze'}</span>
      </button>
    </div>
  );
}
