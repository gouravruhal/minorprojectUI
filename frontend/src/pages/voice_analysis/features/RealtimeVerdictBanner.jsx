import React from 'react';
import { AlertTriangle, ShieldCheck, HelpCircle, Activity } from 'lucide-react';
import './RealtimeVerdictBanner.css';

export function RealtimeVerdictBanner({
  label,
  isDisplaySynthetic,
  isStreaming = false,
  realtimeFrame = 1,
  realtimePhonemeSegment,
  liveConfidence = 96.8,
  liveSyntheticProb = 12,
  modelIdentifier = 'voiceshield-acoustic-dsp-v1'
}) {
  const isInconclusive = label === 'Inconclusive';
  const displayLabel = label || (isDisplaySynthetic ? 'Potentially AI-Generated Speech' : 'Likely Human Speech');

  return (
    <section 
      className={`verdict-analysis-card card animate-fade-in ${isInconclusive ? 'is-warning' : isDisplaySynthetic ? 'is-critical' : 'is-safe'}`} 
      id="results-verdict-panel"
    >
      <div className="verdict-card-header">
        <div className="verdict-header-left">
          <span className="verdict-header-kicker">ACOUSTIC FORENSIC INFERENCE</span>
          <h3 className="verdict-header-title">Live Speech Authenticity</h3>
        </div>

        <div className={`verdict-status-badge ${isStreaming ? 'streaming' : 'standby'}`}>
          <span className={`sim-pulse-dot ${isDisplaySynthetic ? 'pulse-danger' : ''}`} />
          <span>{isStreaming ? `INFERENCE ACTIVE • CHUNK #${realtimeFrame}` : 'STANDBY READY'}</span>
        </div>
      </div>

      <div className="verdict-main-summary-row">
        <div className="verdict-badge-block">
          <div className={`verdict-tag-large ${isInconclusive ? 'warning' : isDisplaySynthetic ? 'danger' : 'safe'}`}>
            {isInconclusive ? (
              <>
                <HelpCircle size={18} />
                <span>INCONCLUSIVE SPEECH SAMPLE</span>
              </>
            ) : isDisplaySynthetic ? (
              <>
                <AlertTriangle size={18} />
                <span>{displayLabel.toUpperCase()}</span>
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>{displayLabel.toUpperCase()}</span>
              </>
            )}
          </div>
          <span className="verdict-tag-sub">
            {isInconclusive
              ? 'Low audio energy or insufficient duration • Acoustic features borderline'
              : isDisplaySynthetic
              ? 'Acoustic vocoder artifacts or unnatural glottal perturbations detected'
              : 'Organic vocal cord micro-tremors and natural formant decay verified'}
          </span>
        </div>

        <div className="verdict-metrics-row">
          <div className="verdict-metric-pill">
            <span className="metric-pill-lbl">Confidence</span>
            <span className="metric-pill-val mono-metric text-orange">{liveConfidence}%</span>
          </div>

          <div className="verdict-metric-pill">
            <span className="metric-pill-lbl">Synthetic Risk</span>
            <span className={`metric-pill-val mono-metric ${isDisplaySynthetic ? 'text-danger' : 'text-safe'}`}>
              {liveSyntheticProb}%
            </span>
          </div>

          <div className="verdict-metric-pill">
            <span className="metric-pill-lbl">Live Phoneme</span>
            <span className="metric-pill-val mono-metric text-orange" style={{ fontSize: '0.88rem' }}>
              {realtimePhonemeSegment ? realtimePhonemeSegment.split(' ')[0] : 'Voiced'}
            </span>
          </div>
        </div>
      </div>

      <div className="verdict-disclaimer-bar">
        <Activity size={12} className="text-dim" />
        <span>Model: {modelIdentifier}. Probabilistic acoustic estimation — not an absolute legal or forensic guarantee.</span>
      </div>
    </section>
  );
}
