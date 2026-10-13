import React from 'react';
import { RealtimeWaveform } from './RealtimeWaveform';
import { SpectralHeatmap } from './SpectralHeatmap';
import './LiveWaveformSection.css';

export function LiveWaveformSection({
  isStreaming,
  currentRiskScore,
  isDisplaySynthetic,
  activeCall,
  liveLiveness: liveLivenessProp,
  liveJitter: liveJitterProp,
  liveShimmer: liveShimmerProp,
  displayVocoder: displayVocoderProp
}) {
  const liveLiveness = liveLivenessProp || (isDisplaySynthetic ? '12%' : `${activeCall?.bioFit || 94}%`);
  const liveJitter = liveJitterProp || (isDisplaySynthetic ? '0.08%' : `${activeCall?.jitterPPQ || 0.74}%`);
  const liveShimmer = liveShimmerProp || (isDisplaySynthetic ? '0.40%' : `${activeCall?.shimmerAPQ || 2.15}%`);
  const displayVocoder = displayVocoderProp || (isDisplaySynthetic ? (activeCall?.vocoderSignature || 'HiFi-GAN / Diffusion') : 'None (Natural Glottal Source)');

  return (
    <section className="live-ai-analysis-container animate-fade-in" id="live-analysis-panel">
      <div className="section-banner-header">
        <h3 className="section-heading">Live AI Acoustic & Spectral Inspection</h3>
        <div className="stream-live-pill">
          <span className="live-pulse-dot" />
          <span>{isStreaming ? 'AI ACOUSTIC DSP RUNNING AT 60 FPS' : 'DSP STANDBY'}</span>
        </div>
      </div>

      <div className="visualizer-dual-grid">
        <RealtimeWaveform
          isStreaming={isStreaming}
          riskScore={currentRiskScore}
        />
        <SpectralHeatmap
          isStreaming={isStreaming}
          riskScore={currentRiskScore}
          vocoderDetected={isDisplaySynthetic}
        />
      </div>

      <div className="telemetry-stats-grid">
        <div className="stat-tile">
          <span className="stat-label">Biometric Liveness</span>
          <span className={`stat-value mono-metric ${isDisplaySynthetic ? 'text-danger' : 'text-safe'}`}>
            {liveLiveness}
          </span>
        </div>

        <div className="stat-tile">
          <span className="stat-label">Glottal Jitter</span>
          <span className="stat-value mono-metric">{liveJitter}</span>
        </div>

        <div className="stat-tile">
          <span className="stat-label">Glottal Shimmer</span>
          <span className="stat-value mono-metric">{liveShimmer}</span>
        </div>

        <div className="stat-tile">
          <span className="stat-label">Vocoder Architecture</span>
          <span className={`stat-value mono-metric ${isDisplaySynthetic ? 'text-danger' : 'text-safe'}`} style={{ fontSize: '0.94rem' }}>
            {displayVocoder}
          </span>
        </div>
      </div>
    </section>
  );
}
