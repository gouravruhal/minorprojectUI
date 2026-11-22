import React, { useState } from 'react';
import { ShieldAlert, Lock, Key, CheckCircle, X } from 'lucide-react';
import { dispatchMfaChallenge, verifyMfaChallenge } from '../../../core/api/voiceAnalysisApi';

export function MicSecurityAlertModal({ alert, onClose }) {
  const [challengeId, setChallengeId] = useState(null);
  const [mfaStatus, setMfaStatus] = useState('IDLE');

  if (!alert) return null;

  const handleTriggerMfa = async () => {
    setMfaStatus('DISPATCHING');
    try {
      const chal = await dispatchMfaChallenge(alert.call_id, 'LIVE_SUBSCRIBER', alert.reason);
      setChallengeId(chal.challenge_id);
      const res = await verifyMfaChallenge(chal.challenge_id);
      if (res.status === 'VERIFIED') {
        setMfaStatus('VERIFIED');
      } else {
        setMfaStatus('FAILED');
      }
    } catch {
      setMfaStatus('FAILED');
    }
  };

  return (
    <div className="security-alert-backdrop animate-fade-in">
      <div className="security-alert-modal card clay-card animate-scale-up">
        <div className="alert-modal-header">
          <div className="flex-center gap-2">
            <div className="alert-pulse-circle">
              <ShieldAlert size={22} className="text-danger" />
            </div>
            <div>
              <span className="badge badge-danger text-xs font-bold">REAL-TIME WEBSOCKET SECURITY ALERT</span>
              <h3 className="alert-modal-title">Autonomous Transaction Lock Engaged</h3>
            </div>
          </div>
          <button type="button" className="btn-clay-secondary btn-xs" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div className="alert-modal-body clay-inset">
          <div className="alert-field-row">
            <span className="alert-label">Call Session ID:</span>
            <span className="alert-val mono-metric">{alert.call_id || 'CALL-ACTIVE'}</span>
          </div>
          <div className="alert-field-row">
            <span className="alert-label">Threat Severity:</span>
            <span className="badge badge-danger">{alert.tier || 'CRITICAL'}</span>
          </div>
          <div className="alert-field-row">
            <span className="alert-label">Threat Diagnosis:</span>
            <span className="alert-val text-danger">{alert.reason || 'Biometric Voice Swap or Neural Vocoder Detected.'}</span>
          </div>
          <div className="alert-field-row">
            <span className="alert-label">Protocol Action:</span>
            <span className="alert-val font-bold text-main">{alert.recommendation || 'FREEZE_TRANSACTION'}</span>
          </div>
        </div>

        <div className="alert-modal-footer">
          {mfaStatus === 'IDLE' ? (
            <button type="button" className="btn-clay-danger btn-sm" onClick={handleTriggerMfa}>
              <Key size={14} className="mr-1 inline" /> Trigger Push Notification MFA Challenge
            </button>
          ) : mfaStatus === 'DISPATCHING' ? (
            <div className="text-xs text-warning animate-pulse">
              <span>Contacting subscriber authentication gateway via REST API...</span>
            </div>
          ) : mfaStatus === 'VERIFIED' ? (
            <div className="text-xs text-safe flex-center gap-1">
              <CheckCircle size={16} />
              <span>Step-Up Challenge Passed ({challengeId}). Safe Override Granted.</span>
            </div>
          ) : (
            <span className="text-xs text-danger">Authentication Challenge Failed.</span>
          )}

          <button type="button" className="btn-clay-secondary btn-sm" onClick={onClose}>
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default MicSecurityAlertModal;
