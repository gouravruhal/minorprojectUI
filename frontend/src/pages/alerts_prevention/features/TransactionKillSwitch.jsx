import React, { useState } from 'react';
import { ShieldAlert, Lock, CheckCircle2 } from 'lucide-react';
import './TransactionKillSwitch.css';

export function TransactionKillSwitch({ isFrozen, onTriggerFreeze }) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className={`transaction-kill-switch glass-panel ${isFrozen ? 'state-frozen' : ''}`} id="transaction-kill-switch-card">
      <div className="killswitch-header">
        <div className="title-row">
          {isFrozen ? (
            <Lock size={18} className="icon-safe" />
          ) : (
            <ShieldAlert size={18} className="icon-danger" />
          )}
          <h3 className="killswitch-heading">Core Banking Transaction Shield</h3>
        </div>
        <span className={`badge ${isFrozen ? 'badge-safe' : 'badge-danger'}`}>
          {isFrozen ? 'TX GATEWAY LOCKED' : 'TRANSACTION ACTIVE'}
        </span>
      </div>

      <p className="killswitch-desc">
        Direct REST webhook interface into Core Banking System (Finacle / BaNCS) to place an instantaneous hold on high-value outbound funds.
      </p>

      {!isFrozen ? (
        <div className="killswitch-actions">
          {!showConfirm ? (
            <button
              id="initiate-freeze-btn"
              className="btn-danger full-width-btn"
              onClick={() => setShowConfirm(true)}
            >
              <Lock size={16} />
              <span>FREEZE TRANSACTION GATEWAY</span>
            </button>
          ) : (
            <div className="confirm-box">
              <span className="confirm-text">Confirm immediate emergency hold on pending wires?</span>
              <div className="confirm-buttons">
                <button
                  id="confirm-freeze-btn"
                  className="btn-danger"
                  onClick={() => {
                    onTriggerFreeze();
                    setShowConfirm(false);
                  }}
                >
                  Yes, Execute Lock
                </button>
                <button
                  className="btn-outline"
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="frozen-status-card" id="frozen-status-display">
          <div className="status-row">
            <CheckCircle2 size={18} className="text-safe" />
            <span className="frozen-title">EMERGENCY WIRE HOLD ACTIVE</span>
          </div>
          <div className="frozen-meta-grid">
            <div className="frozen-meta-item">
              <span className="frozen-meta-label">Webhook ID:</span>
              <span className="frozen-meta-val mono-metric">WH-LOCK-77194A</span>
            </div>
            <div className="frozen-meta-item">
              <span className="frozen-meta-label">Beneficiary Account:</span>
              <span className="frozen-meta-val mono-metric">HDFC-001928374...</span>
            </div>
            <div className="frozen-meta-item">
              <span className="frozen-meta-label">Enforcement:</span>
              <span className="frozen-meta-val text-safe">Zero Loss Prevented</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
