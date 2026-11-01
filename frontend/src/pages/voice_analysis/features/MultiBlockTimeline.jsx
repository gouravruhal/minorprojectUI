import React, { useState } from 'react';
import { Layers, Activity, AlertOctagon, UserCheck, ShieldAlert, Cpu } from 'lucide-react';
import './MultiBlockTimeline.css';

export function MultiBlockTimeline({ segments = [], peakSegment = null }) {
  const [selectedIdx, setSelectedIdx] = useState(
    peakSegment ? peakSegment.segment_index : (segments.length > 0 ? 0 : null)
  );

  if (!segments || segments.length === 0) return null;

  const activeSegment = segments.find((s) => s.segment_index === selectedIdx) || segments[0];

  const getTierColor = (tier, hasSwap) => {
    if (hasSwap || tier === 'CRITICAL') return '#ef4444';
    if (tier === 'HIGH') return '#f97316';
    if (tier === 'ELEVATED') return '#eab308';
    return '#22c55e';
  };

  return (
    <div className="multiblock-timeline-card card animate-fade-in">
      {/* Header */}
      <div className="multiblock-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={17} style={{ color: 'var(--accent-blue)' }} />
          <h4 className="multiblock-title">Multi-Segment Temporal Sliding Window Forensics</h4>
        </div>
        <span className="multiblock-badge">
          4.0s Window • 2.0s Stride (50% Overlap) • {segments.length} Blocks
        </span>
      </div>

      {/* Visual Sequence of Blocks */}
      <div className="timeline-blocks-strip">
        {segments.map((seg) => {
          const isSelected = seg.segment_index === activeSegment.segment_index;
          const tierColor = getTierColor(seg.threat_tier, seg.voice_swap_detected);
          const isPeak = peakSegment && seg.segment_index === peakSegment.segment_index;

          return (
            <div
              key={seg.segment_index}
              className={`timeline-block-item ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedIdx(seg.segment_index)}
              style={{ borderColor: isSelected ? tierColor : 'rgba(166, 175, 195, 0.3)' }}
            >
              <div className="block-top-meta">
                <span className="block-index">#{seg.segment_index + 1}</span>
                {isPeak && <span className="peak-badge">PEAK</span>}
              </div>
              <div className="block-time">{seg.time_range || `${seg.start_sec}s - ${seg.end_sec}s`}</div>

              {/* Mini Risk Gauge */}
              <div className="block-bar-wrapper">
                <div
                  className="block-bar-fill"
                  style={{
                    height: `${Math.max(12, Math.min(100, seg.risk_score))}%`,
                    backgroundColor: tierColor
                  }}
                />
              </div>

              <div className="block-risk-val" style={{ color: tierColor }}>
                {Math.round(seg.risk_score)}
              </div>

              {seg.voice_swap_detected && (
                <div className="swap-indicator" title="Voice Swap Detected">
                  SWAP
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Segment Inspector Detail Panel */}
      {activeSegment && (
        <div className="segment-inspector-panel animate-fade-in">
          <div className="inspector-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Activity size={16} style={{ color: 'var(--accent-green)' }} />
              <span className="inspector-title">
                Segment #{activeSegment.segment_index + 1} Forensic Inspector ({activeSegment.time_range})
              </span>
            </div>
            <div
              className="inspector-tier-pill"
              style={{
                backgroundColor: `${getTierColor(activeSegment.threat_tier, activeSegment.voice_swap_detected)}22`,
                borderColor: getTierColor(activeSegment.threat_tier, activeSegment.voice_swap_detected),
                color: getTierColor(activeSegment.threat_tier, activeSegment.voice_swap_detected)
              }}
            >
              {activeSegment.voice_swap_detected ? 'VOICE SWAP ALERT' : activeSegment.threat_tier}
            </div>
          </div>

          <div className="inspector-grid">
            {/* Spoof Risk */}
            <div className="inspector-stat">
              <span className="stat-label">Segment Risk Score</span>
              <span className="stat-value" style={{ color: getTierColor(activeSegment.threat_tier, activeSegment.voice_swap_detected) }}>
                {activeSegment.risk_score} / 100
              </span>
            </div>

            {/* Synthetic Probability */}
            <div className="inspector-stat">
              <span className="stat-label">Synthetic Confidence</span>
              <span className="stat-value">{activeSegment.spoof_prob}%</span>
            </div>

            {/* Biometric Drift */}
            <div className="inspector-stat">
              <span className="stat-label">Speaker Biometric Drift</span>
              <span className="stat-value" style={{ color: activeSegment.speaker_drift >= 0.35 ? '#ef4444' : '#38bdf8' }}>
                {activeSegment.speaker_drift?.toFixed(2) || '0.00'}
              </span>
            </div>

            {/* Voice Swap Status */}
            <div className="inspector-stat">
              <span className="stat-label">Voice Swap Status</span>
              <span className="stat-value" style={{ color: activeSegment.voice_swap_detected ? '#ef4444' : '#22c55e' }}>
                {activeSegment.voice_swap_detected ? 'INTRUSION DETECTED' : 'CONSISTENT'}
              </span>
            </div>
          </div>

          {/* Three-Pillar Attributions */}
          {activeSegment.attributions && (
            <div className="inspector-pillars-row">
              <div className="pillar-bar-card">
                <div className="pillar-title">Spectral Anomaly</div>
                <div className="pillar-meter">
                  <div className="pillar-fill" style={{ width: `${activeSegment.attributions.spectral_anomaly}%`, backgroundColor: '#38bdf8' }} />
                </div>
                <div className="pillar-num">{activeSegment.attributions.spectral_anomaly}%</div>
              </div>

              <div className="pillar-bar-card">
                <div className="pillar-title">Phase Discontinuity</div>
                <div className="pillar-meter">
                  <div className="pillar-fill" style={{ width: `${activeSegment.attributions.phase_discontinuity}%`, backgroundColor: 'var(--accent-yellow)' }} />
                </div>
                <div className="pillar-num">{activeSegment.attributions.phase_discontinuity}%</div>
              </div>

              <div className="pillar-bar-card">
                <div className="pillar-title">Prosodic Unnaturalness</div>
                <div className="pillar-meter">
                  <div className="pillar-fill" style={{ width: `${activeSegment.attributions.prosodic_unnaturalness}%`, backgroundColor: '#a855f7' }} />
                </div>
                <div className="pillar-num">{activeSegment.attributions.prosodic_unnaturalness}%</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default MultiBlockTimeline;

