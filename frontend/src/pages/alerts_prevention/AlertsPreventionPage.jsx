import React from 'react';
import { ShieldAlert, HelpCircle } from 'lucide-react';
import { AlertsPreventionHeader } from './features/AlertsPreventionHeader';
import { LiveIncidentStream } from './features/LiveIncidentStream';
import { BiometricChallengeCard } from './features/BiometricChallengeCard';
import { TransactionKillSwitch } from './features/TransactionKillSwitch';
import { SecurityChallengePrompts } from './features/SecurityChallengePrompts';
import './AlertsPreventionPage.css';

export function AlertsPreventionPage({
  activeCall,
  _isStreaming,
  currentRiskScore,
  isFrozen,
  onTriggerFreeze,
  onTriggerMfa
}) {
  const isCritical = currentRiskScore >= 70;

  const incidentLogs = [
    {
      id: 'evt-1',
      time: '10:24:18 AM',
      level: 'CRITICAL',
      title: 'Neural Vocoder Phase Inconsistency Flagged',
      detail: `Synthesized speech signature detected: ${activeCall.vocoderSignature}. Confidence: ${activeCall.acousticAnomaly}%.`
    },
    {
      id: 'evt-2',
      time: '10:24:12 AM',
      level: isCritical ? 'CRITICAL' : 'SAFE',
      title: isCritical ? 'Urgency Keyword Social Engineering Pattern' : 'Natural Speech Prosody Verified',
      detail: isCritical 
        ? `Caller requested: "${activeCall.keywords ? activeCall.keywords.join(', ') : 'Urgent action'}"`
        : 'Zero extortion or unauthorized authorization phrases identified.'
    },
    {
      id: 'evt-3',
      time: '10:24:05 AM',
      level: 'DEFENSE',
      title: isFrozen ? 'Core Banking API Kill Switch Active' : 'Automated Defense Circuit Standby',
      detail: isFrozen 
        ? 'Account hold signal broadcasted via ISO-20022 webhook. Outbound funds locked.' 
        : 'Threshold trigger armed at >70% Bayesian probability.'
    },
    {
      id: 'evt-4',
      time: '10:23:45 AM',
      level: 'INFO',
      title: 'Telecom Ingress Codec Initialized',
      detail: `${activeCall.network} session initiated. Caller ID: ${activeCall.callerNumber}.`
    }
  ];

  return (
    <div className="alerts-prevention-view animate-fade-in" id="alerts-prevention-page">
      <AlertsPreventionHeader isFrozen={isFrozen} isCritical={isCritical} />

      <div className="alerts-main-grid">
        <LiveIncidentStream incidentLogs={incidentLogs} />

        <section className="interventions-panel card">
          <div className="panel-title-group">
            <ShieldAlert size={18} className="text-orange" />
            <h3 className="panel-heading">High-Priority Defense Actions</h3>
          </div>

          <div className="killswitch-wrapper">
            <TransactionKillSwitch
              isFrozen={isFrozen}
              onTriggerFreeze={onTriggerFreeze}
            />
          </div>

          <BiometricChallengeCard
            callerName={activeCall.callerName}
            onTriggerMfa={onTriggerMfa}
          />

          <div className="prompts-accordion card">
            <div className="prompts-top">
              <HelpCircle size={18} className="text-orange" />
              <div className="prompts-meta">
                <h4 className="prompts-title">Cognitive Counter-Question Prompts</h4>
                <span className="prompts-sub">Real-Time Operator Counter-Script</span>
              </div>
            </div>
            <SecurityChallengePrompts />
          </div>
        </section>
      </div>
    </div>
  );
}

export default AlertsPreventionPage;
