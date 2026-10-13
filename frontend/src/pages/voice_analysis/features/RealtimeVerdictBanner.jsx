import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import './RealtimeVerdictBanner.css';

export function RealtimeVerdictBanner({
  isDisplaySynthetic,
  isStreaming = false,
  realtimeFrame = 1,
  realtimePhonemeSegment,
  liveConfidence = 98.4,
  liveSyntheticProb = 91
}) {
  return (
    <section 
      className={`verdict-analysis-card card animate-fade-in ${isDisplaySynthetic ? 'is-critical' : 'is-safe'}`} 
      id="results-verdict-panel"
    >
      <div className="verdict-card-header">
        <div className="verdict-header-left">
          <span className="verdict-header-kicker">PREDICTIVE INFERENCE</span>
          <h3 className="verdict-header-title">Live Forensic Verdict</h3>
        </div>

        <div className={`verdict-status-badge ${isStreaming ? 'streaming' : 'standby'}`}>
          <span className={`sim-pulse-dot ${isDisplaySynthetic ? 'pulse-danger' : ''}`} />
          <span>{isStreaming ? `INFERENCE ACTIVE • CHUNK #${realtimeFrame}` : 'STANDBY READY'}</span>
        </div>
      </div>

      <div className="verdict-main-summary-row">
        <div className="verdict-badge-block">
          <div className={`verdict-tag-large ${isDisplaySynthetic ? 'danger' : 'safe'}`}>
            {isDisplaySynthetic ? (
              <>
                <AlertTriangle size={18} />
                <span>AI VOICE CLONE DETECTED</span>
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>AUTHENTIC HUMAN VOICE</span>
              </>
            )}
          </div>
          <span className="verdict-tag-sub">
            {isDisplaySynthetic
              ? 'Synthetic vocoder signature detected • High spoof risk'
              : 'Organic vocal cord resonance verified • Identity baseline passed'}
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
    </section>
  );
}
