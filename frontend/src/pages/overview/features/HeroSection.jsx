import React from 'react';
import { ShieldAlert, ArrowRight, Activity } from 'lucide-react';

export function HeroSection({ onLaunchConsole, onLaunchPipeline }) {
  return (
    <section className="hero-section card">
      <h1 className="hero-title">
        Real-Time Detection & Prevention of <br />
        <span className="hero-gradient-text">AI Voice Cloning Impersonation</span>
      </h1>

      <p className="hero-subtitle">
        An enterprise-grade, privacy-preserving defense framework designed to inspect active telephonic audio streams in near real-time (&lt;300ms latency), detect neural speech synthesis artifacts, and halt fraudulent financial transactions before damage occurs.
      </p>

      <div className="hero-actions">
        <button 
          id="hero-launch-console-btn"
          className="btn-primary hero-btn"
          onClick={onLaunchConsole}
        >
          <Activity size={18} />
          <span>Launch Live Ingress Console</span>
          <ArrowRight size={16} />
        </button>

        <button 
          id="hero-view-pipeline-btn"
          className="btn-outline hero-btn"
          onClick={onLaunchPipeline}
        >
          <ShieldAlert size={18} />
          <span>Inspect Architecture & Defense Pipeline</span>
        </button>
      </div>

      <div className="hero-metrics-grid">
        <div className="metric-pill">
          <span className="metric-val mono-metric">&lt; 300 ms</span>
          <span className="metric-lbl">Analysis & Action Latency</span>
        </div>
        <div className="metric-pill">
          <span className="metric-val mono-metric">98.2%</span>
          <span className="metric-lbl">EER on Indic Clone Benchmarks</span>
        </div>
        <div className="metric-pill">
          <span className="metric-val mono-metric">100% Volatile</span>
          <span className="metric-lbl">DPDP Act 2023 RAM Processing</span>
        </div>
        <div className="metric-pill">
          <span className="metric-val mono-metric">Dual-Stream</span>
          <span className="metric-lbl">Acoustic & Biomechanical Fusion</span>
        </div>
      </div>
    </section>
  );
}
