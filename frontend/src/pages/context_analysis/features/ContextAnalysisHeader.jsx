import React from 'react';
import { BrainCircuit, ShieldAlert, ShieldCheck } from 'lucide-react';

export function ContextAnalysisHeader({ isCritical = false, recordingCount = 4 }) {
  return (
    <section className="context-header card clay-card">
      <div className="context-header-left">
        <div className="header-badge-row">
          <span className="badge badge-neutral flex-center gap-1">
            <BrainCircuit size={12} />
            <span>TIER 2 &bull; NLP & CONVERSATIONAL CONTEXT</span>
          </span>
          <span className={`badge ${isCritical ? 'badge-danger' : 'badge-safe'}`}>
            {isCritical ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
            <span>{isCritical ? 'HIGH CONVERSATIONAL THREAT' : 'BENIGN CONVERSATION'}</span>
          </span>
          <span className="badge badge-accent">
            {recordingCount} Voice Recordings Ready
          </span>
        </div>
        <h2 className="context-title">Conversational Context & Social Engineering Forensics</h2>
        <p className="context-subtitle">
          Synchronizes with Voice Analysis recordings to transcribe speech-to-text, extract psychological urgency and coercion tokens, and fuse multi-modal Bayesian risk.
        </p>
      </div>
    </section>
  );
}

export default ContextAnalysisHeader;
