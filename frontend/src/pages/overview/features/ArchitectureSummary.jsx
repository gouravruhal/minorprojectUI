import React from 'react';
import { Cpu, Radio, ShieldAlert } from 'lucide-react';

export function ArchitectureSummary() {
  return (
    <section className="pillars-section">
      <div className="section-header">
        <div className="section-pill">Defense In Depth</div>
        <h2 className="section-title">The Three Pillars of Voice Defense</h2>
        <p className="section-desc">
          Why traditional spectral analysis fails against modern zero-shot synthesizers and how our multi-modal approach neutralizes voice clones.
        </p>
      </div>

      <div className="pillars-grid">
        <div className="pillar-card card">
          <div className="pillar-icon-box">
            <Cpu size={24} className="text-orange" />
          </div>
          <h3 className="pillar-title">Biomechanical Voiceprint Inspection</h3>
          <p className="pillar-text">
            Tracks glottal pulse timing, micro-jitter, and shimmer amplitude perturbations that biological human vocal folds exhibit naturally, but zero-shot neural models synthesize with artificial regularity.
          </p>
          <span className="pillar-stat mono-metric">PPQ5 / APQ3 Glottal Dynamics</span>
        </div>

        <div className="pillar-card card">
          <div className="pillar-icon-box">
            <Radio size={24} className="text-orange" />
          </div>
          <h3 className="pillar-title">Neural Vocoder Fingerprint Engine</h3>
          <p className="pillar-text">
            Exposes phase mismatches in the 4kHz-8kHz frequency band characteristic of neural vocoders (HiFi-GAN, BigVGAN) and lossy Indian telecom compression algorithms (AMR-WB / VoLTE).
          </p>
          <span className="pillar-stat mono-metric">Continuous Phase Manifolds</span>
        </div>

        <div className="pillar-card card">
          <div className="pillar-icon-box">
            <ShieldAlert size={24} className="text-orange" />
          </div>
          <h3 className="pillar-title">Context-Aware Core Banking Interventions</h3>
          <p className="pillar-text">
            Correlates speech authenticity scores with live conversational urgency markers, autonomously halting high-value financial transfers and triggering out-of-band biometric push challenges.
          </p>
          <span className="pillar-stat mono-metric">ISO-20022 Webhook Kill Switch</span>
        </div>
      </div>
    </section>
  );
}
