import React from 'react';

export function DefenseWorkflowSteps() {
  return (
    <section className="workflow-section">
      <div className="section-header">
        <div className="section-pill">Execution Lifecycle</div>
        <h2 className="section-title">End-to-End Live Threat Interception</h2>
        <p className="section-desc">
          How VoiceShield AI continuously monitors calls and protects corporate and citizen accounts in 4 autonomous stages.
        </p>
      </div>

      <div className="steps-grid">
        <div className="step-card card">
          <div className="step-num">01</div>
          <h3 className="step-title">Ingress Stream Buffering</h3>
          <p className="step-text">
            Captures live telephonic SIP audio and chunks it into sliding 400ms PCM windows without persistent disk writes.
          </p>
        </div>

        <div className="step-card card">
          <div className="step-num">02</div>
          <h3 className="step-title">Dual-Stream Feature Extraction</h3>
          <p className="step-text">
            Calculates LFCC spectral filterbanks alongside glottal F0 pitch jitter and harmonic phase consistency.
          </p>
        </div>

        <div className="step-card card">
          <div className="step-num">03</div>
          <h3 className="step-title">Bayesian Score Aggregation</h3>
          <p className="step-text">
            Fuses AASIST-Light acoustic probability with NLP conversational pressure metrics into a dynamic 0-100% risk index.
          </p>
        </div>

        <div className="step-card card">
          <div className="step-num">04</div>
          <h3 className="step-title">Autonomous Action Dispatch</h3>
          <p className="step-text">
            Dispatches Core Banking webhook holds and pushes FIDO2 biometric authentication to the account holder's registered mobile device.
          </p>
        </div>
      </div>
    </section>
  );
}
