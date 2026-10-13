import React from 'react';

export function AlertsPreventionHeader({ isFrozen, isCritical }) {
  return (
    <section className="alerts-header card">
      <div className="alerts-header-left">
        <div className="header-badge-row">
          <span className="badge badge-neutral">ACTIVE DEFENSE TIER</span>
          <span className={`badge ${isFrozen ? 'badge-safe' : isCritical ? 'badge-danger' : 'badge-neutral'}`}>
            {isFrozen ? 'SYSTEM PROTECTED (FROZEN)' : isCritical ? 'ACTION REQUIRED: ATTACK IN PROGRESS' : 'ALL CIRCUITS NORMAL'}
          </span>
        </div>
        <h2 className="alerts-title">Security Incident Feed & Active Prevention Controls</h2>
        <p className="alerts-subtitle">
          Autonomous threat containment module providing out-of-band identity verification, sub-second transaction kill switches, and structured operator counter-measures.
        </p>
      </div>
    </section>
  );
}
