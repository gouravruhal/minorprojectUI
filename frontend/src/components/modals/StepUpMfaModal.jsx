import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle2, XCircle, Clock, X } from 'lucide-react';
import './StepUpMfaModal.css';

export function StepUpMfaModal({ isOpen, onClose, activeCall }) {
  const [status, setStatus] = useState('pending');
  const [countdown, setCountdown] = useState(45);

  useEffect(() => {
    if (isOpen) {
      const timer = setInterval(() => {
        setCountdown((c) => (c > 0 ? c - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setStatus('pending');
    setCountdown(45);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="mfa-modal-overlay" id="step-up-mfa-modal">
      <div className="mfa-modal-box glass-panel">
        <div className="modal-header">
          <div className="title-row">
            <Smartphone size={20} className="text-cyan" />
            <h3 className="modal-title">Out-of-Band Biometric Step-Up MFA</h3>
          </div>
          <button className="modal-close-btn" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        <p className="modal-desc">
          Dispatched push verification request directly to executive's registered hardware device to defeat telephonic voice impersonation.
        </p>

        <div className="target-device-card">
          <div className="device-row">
            <span className="device-label">Registered Target:</span>
            <span className="device-val">{activeCall.callerName}</span>
          </div>
          <div className="device-row">
            <span className="device-label">Secure Hardware ID:</span>
            <span className="device-val mono-metric">IND-HW-APPLE-SEC-992</span>
          </div>
          <div className="device-row">
            <span className="device-label">Challenge Token:</span>
            <span className="device-val mono-metric text-cyan">AUTH-TOKEN-7712-F</span>
          </div>
        </div>

        <div className="mfa-status-view">
          {status === 'pending' && (
            <div className="pending-state">
              <div className="radar-spinner" />
              <div className="pending-text">
                <span className="waiting-heading">Awaiting Mobile Push Confirmation</span>
                <span className="countdown-text mono-metric">
                  <Clock size={14} /> Time remaining: {countdown}s
                </span>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="success-state">
              <CheckCircle2 size={36} className="text-safe" />
              <div className="state-text">
                <h4 className="state-title text-safe">Hardware Biometrics Verified</h4>
                <p className="state-sub">Caller verified via device Secure Enclave (FaceID passed).</p>
              </div>
            </div>
          )}

          {status === 'failed' && (
            <div className="failed-state">
              <XCircle size={36} className="text-danger" />
              <div className="state-text">
                <h4 className="state-title text-danger">Verification Rejected / Timeout</h4>
                <p className="state-sub">Caller failed to acknowledge the out-of-band prompt. Impersonation confirmed.</p>
              </div>
            </div>
          )}
        </div>

        <div className="demo-sim-buttons">
          <span className="sim-helper-label">Evaluator Interactive Simulation:</span>
          <div className="sim-buttons-group">
            <button
              id="mfa-simulate-success-btn"
              className="btn-outline sim-btn"
              onClick={() => setStatus('success')}
            >
              Simulate Mobile Approved
            </button>
            <button
              id="mfa-simulate-fail-btn"
              className="btn-outline sim-btn text-danger"
              onClick={() => setStatus('failed')}
            >
              Simulate Rejected / Timeout
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={handleClose}>
            Close Inspection Window
          </button>
        </div>
      </div>
    </div>
  );
}

export default StepUpMfaModal;
