import React from 'react';
import { KeyRound } from 'lucide-react';

export function BiometricChallengeCard({ callerName, onTriggerMfa }) {
  return (
    <div className="mfa-card card">
      <div className="mfa-top">
        <KeyRound size={18} className="text-orange" />
        <div className="mfa-meta">
          <h4 className="mfa-title">Out-of-Band Biometric Challenge</h4>
          <span className="mfa-sub">FIDO2 / WebAuthn Hardware Push</span>
        </div>
      </div>
      <p className="mfa-desc">
        Pushes an asynchronous biometric cryptographic prompt directly to the registered personal hardware device of <strong>{callerName}</strong>, completely bypassing the phone call channel.
      </p>
      <button
        id="alerts-trigger-mfa-btn"
        className="btn-primary"
        onClick={onTriggerMfa}
      >
        <KeyRound size={15} />
        <span>Dispatch Out-of-Band Challenge</span>
      </button>
    </div>
  );
}
