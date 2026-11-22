import React, { useState } from 'react';
import { ShieldCheck, PhoneForwarded, Lock, Key, CheckCircle2 } from 'lucide-react';
import { dispatchMfaChallenge, verifyMfaChallenge } from '../../../core/api/voiceAnalysisApi';

export function MicAutomatedResponseBanner({ latestResult, isStreaming }) {
  const [challengeId, setChallengeId] = useState(null);
  const [mfaStatus, setMfaStatus] = useState('IDLE');

  const risk = latestResult ? Number(latestResult.riskScore ?? 0) : 0;
  const tier = latestResult ? latestResult.threatTier : 'SAFE';
  const isCritical = risk >= 70 || tier === 'CRITICAL';
  const isWarn = (risk >= 40 && !isCritical) || tier === 'WARN';

  const handleSimulateMFA = async () => {
    setMfaStatus('DISPATCHING');
    try {
      const chal = await dispatchMfaChallenge('ACTIVE_CALL', 'SUBSCRIBER_LINE');
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

  const handleResetLock = () => {
    setChallengeId(null);
    setMfaStatus('IDLE');
  };

  if (!isStreaming && !latestResult) return null;

  return (
    <div className={`automated-response-banner card clay-card ${isCritical ? 'banner-critical' : isWarn ? 'banner-warn' : 'banner-safe'}`}>
      <div className="banner-content-row">
        <div className="banner-icon-col">
          {isCritical ? (
            <div className="pulse-danger-circle">
              <Lock size={22} className="text-danger" />
            </div>
          ) : isWarn ? (
            <div className="pulse-warning-circle">
              <PhoneForwarded size={22} className="text-warning" />
            </div>
          ) : (
            <div className="safe-circle">
              <ShieldCheck size={22} className="text-safe" />
            </div>
          )}
        </div>

        <div className="banner-details-col">
          <div className="banner-status-badge-row">
            <span className="badge badge-neutral text-xs font-bold">AUTOMATED RESPONSE PROTOCOL</span>
            <span className={`badge ${isCritical ? 'badge-danger' : isWarn ? 'badge-warning' : 'badge-safe'}`}>
              {isCritical ? 'THRESHOLD 70+ CRITICAL' : isWarn ? 'THRESHOLD 40-69 WARN' : 'THRESHOLD 0-39 SAFE'}
            </span>
          </div>

          <h4 className="banner-title">
            {isCritical
              ? 'Transaction Locked: Automated Security Protocol Freezes Operations'
              : isWarn
              ? 'Operator Intercept: Mandatory Out-of-Band Callback Verification'
              : 'Autonomous Clearance: Normal Monitoring Active'}
          </h4>

          <p className="banner-desc text-xs text-dim">
            {isCritical
              ? 'Acoustic vocoder anomalies or biometric voice swap detected exceeding critical 70% threshold. High-value wire transfers and credentials are autonomously quarantined.'
              : isWarn
              ? 'Moderate acoustic anomaly or unknown route detected (40-69%). Protocol instructs the operator to perform an out-of-band callback before approving transactions.'
              : 'Voice characteristics exhibit natural glottal jitter, biological F0 modulation, and consistent speaker identity. No transactional restrictions imposed.'}
          </p>

          {isCritical && (
            <div className="banner-action-buttons">
              {mfaStatus === 'IDLE' ? (
                <button type="button" className="btn-clay-danger btn-sm" onClick={handleSimulateMFA}>
                  <Key size={14} className="mr-1 inline" /> Trigger Instant Step-Up MFA Challenge
                </button>
              ) : mfaStatus === 'DISPATCHING' ? (
                <div className="mfa-pending-row text-xs text-warning animate-pulse">
                  <span>Dispatching cryptographic push OTP via backend security API...</span>
                </div>
              ) : mfaStatus === 'VERIFIED' ? (
                <div className="mfa-resolved-row text-xs text-safe">
                  <CheckCircle2 size={16} className="inline mr-1" />
                  <span>Biometric Step-Up Challenge Passed ({challengeId}). Safe Override Granted.</span>
                  <button type="button" className="btn-clay-secondary btn-xs ml-3" onClick={handleResetLock}>
                    Clear Override
                  </button>
                </div>
              ) : (
                <span className="text-xs text-danger">MFA Verification Failed.</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MicAutomatedResponseBanner;
