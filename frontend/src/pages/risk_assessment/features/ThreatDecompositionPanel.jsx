import React from 'react';
import { Layers, Info } from 'lucide-react';

export function ThreatDecompositionPanel({ activeCall }) {
  return (
    <section className="decomposition-panel card">
      <div className="panel-title-group">
        <Layers size={18} className="text-orange" />
        <h3 className="panel-heading">4-Factor Threat Decomposition</h3>
      </div>

      <div className="factors-list">
        <div className="factor-row">
          <div className="factor-meta">
            <span className="factor-name">AASIST-Light Acoustic Distance</span>
            <span className="factor-score mono-metric text-orange">{activeCall.acousticAnomaly}%</span>
          </div>
          <div className="factor-progress-track">
            <div className="factor-progress-fill" style={{ width: `${activeCall.acousticAnomaly}%` }} />
          </div>
          <span className="factor-desc">LFCC & CQCC graph neural network filterbank phase mismatch.</span>
        </div>

        <div className="factor-row">
          <div className="factor-meta">
            <span className="factor-name">Neural Vocoder Fingerprint</span>
            <span className="factor-score mono-metric text-orange">{activeCall.vocoderDetected ? '94%' : '4%'}</span>
          </div>
          <div className="factor-progress-track">
            <div className="factor-progress-fill" style={{ width: activeCall.vocoderDetected ? '94%' : '4%' }} />
          </div>
          <span className="factor-desc">{activeCall.vocoderSignature}</span>
        </div>

        <div className="factor-row">
          <div className="factor-meta">
            <span className="factor-name">Glottal Biometric Jitter (PPQ5)</span>
            <span className="factor-score mono-metric text-orange">{Math.round((1 - activeCall.jitterPPQ) * 100)}%</span>
          </div>
          <div className="factor-progress-track">
            <div className="factor-progress-fill" style={{ width: `${Math.round((1 - activeCall.jitterPPQ) * 100)}%` }} />
          </div>
          <span className="factor-desc">Natural vocal cord perturbation (Jitter: {activeCall.jitterPPQ}%, Shimmer: {activeCall.shimmerAPQ}%).</span>
        </div>

        <div className="factor-row">
          <div className="factor-meta">
            <span className="factor-name">Conversational Urgency Factor</span>
            <span className="factor-score mono-metric text-orange">{Math.round((activeCall.contextMultiplier || 1.0) * 50)}%</span>
          </div>
          <div className="factor-progress-track">
            <div className="factor-progress-fill" style={{ width: `${Math.round((activeCall.contextMultiplier || 1.0) * 50)}%` }} />
          </div>
          <span className="factor-desc">Multi-modal NLP threat factor: {activeCall.contextMultiplier}x risk amplification.</span>
        </div>
      </div>

      <div className="formula-box">
        <div className="formula-header">
          <Info size={14} className="text-orange" />
          <span className="formula-title">Bayesian Formula Specification</span>
        </div>
        <code className="formula-code mono-metric">
          R(t) = α · S_acoustic(t) + β · V_vocoder(t) + γ · (1 - J_glottal) + δ · C_nlp
        </code>
        <p className="formula-note">
          Weights dynamically calibrated: α=0.35, β=0.25, γ=0.25, δ=0.15 with temporal exponential decay.
        </p>
      </div>
    </section>
  );
}
