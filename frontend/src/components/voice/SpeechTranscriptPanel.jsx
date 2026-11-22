import React from 'react';
import { MessageSquare, AlertOctagon, UserCheck, UserX, ShieldAlert, Sparkles } from 'lucide-react';
import './SpeechTranscriptPanel.css';

export function SpeechTranscriptPanel({ speechAnalysis, isStreaming }) {
  if (!speechAnalysis && !isStreaming) return null;

  const analysis = speechAnalysis || {};
  const transcript = analysis.transcript || '';
  const phrases = analysis.detected_phrases || [];
  const attribution = analysis.speaker_attribution || {};
  const reasoning = analysis.llm_reasoning || '';
  const semanticScore = analysis.semantic_threat_score ?? 0;
  const isCritThreat = semanticScore >= 60 || attribution.impersonation_mismatch;

  return (
    <div className="speech-transcript-card card clay-card animate-fade-in" id="speech-intent-panel">
      <div className="panel-header-row">
        <div className="panel-title-group">
          <MessageSquare size={18} className="text-accent" />
          <h3 className="panel-heading">Spoken Dialogue, Intent & Speaker Attribution LLM</h3>
        </div>
        <div className="flex-center gap-2">
          <span className="badge badge-accent flex-center gap-1">
            <Sparkles size={11} />
            <span>AudioLLM-ASR-Intent-v2</span>
          </span>
          <span className={`badge ${isCritThreat ? 'badge-danger' : phrases.length > 0 ? 'badge-warning' : 'badge-safe'}`}>
            Semantic Threat: {semanticScore}%
          </span>
        </div>
      </div>

      <div className="transcript-main-grid">
        <div className="transcript-box-col clay-inset">
          <div className="transcript-box-header">
            <span className="transcript-label">Recognized Spoken Utterance</span>
            <span className="text-xs text-dim">100% In-Memory RAM ASR</span>
          </div>
          <p className="transcript-text">
            {transcript || (
              <span className="text-dim italic">
                {isStreaming
                  ? 'Listening for acoustic dialogue... Transcribing spoken phonemes in real-time.'
                  : 'Awaiting audio ingress.'}
              </span>
            )}
          </p>
        </div>

        <div className="attribution-box-col clay-inset">
          <div className="attribution-header">
            <span className="attribution-label">Speaker Biometric Attribution</span>
            {attribution.impersonation_mismatch ? (
              <UserX size={16} className="text-danger" />
            ) : (
              <UserCheck size={16} className="text-safe" />
            )}
          </div>
          <div className="attribution-details">
            <div className="attr-row">
              <span className="attr-title">Speaker Identity:</span>
              <span className="font-bold text-xs">{attribution.claimed_identity || 'Standard Caller'}</span>
            </div>
            <div className="attr-row">
              <span className="attr-title">Biometric Status:</span>
              <span className={`badge ${attribution.impersonation_mismatch ? 'badge-danger' : 'badge-safe'} text-xs`}>
                {attribution.biometric_status || 'VERIFIED_ORGANIC'}
              </span>
            </div>
            <div className="attr-row">
              <span className="attr-title">Voiceprint Match:</span>
              <span className="mono-metric font-bold text-xs">
                {typeof attribution.voiceprint_match_pct === 'number' ? `${attribution.voiceprint_match_pct}%` : '100%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {phrases.length > 0 && (
        <div className="flagged-phrases-container">
          <div className="phrases-header-row">
            <span className="phrases-heading flex-center gap-1">
              <AlertOctagon size={14} className="text-danger" />
              <span>Suspicious Social Engineering Phrases Flagged ({phrases.length})</span>
            </span>
          </div>
          <div className="phrases-chips-grid">
            {phrases.map((item, idx) => (
              <div key={idx} className="phrase-chip-card clay-inset">
                <div className="phrase-chip-top">
                  <span className="phrase-quote font-bold text-danger">&ldquo;{item.phrase}&rdquo;</span>
                  <span className={`badge ${item.severity === 'CRITICAL' ? 'badge-danger' : 'badge-warning'} text-xs`}>
                    {item.category}
                  </span>
                </div>
                <p className="phrase-desc text-dim text-xs">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {reasoning && (
        <div className="cross-modal-reasoning-box clay-inset">
          <div className="reasoning-header">
            <ShieldAlert size={14} className="text-accent" />
            <span className="font-semibold text-xs text-accent">Cross-Modal Acoustic & Semantic LLM Audit</span>
          </div>
          <p className="reasoning-body text-xs text-dim">{reasoning}</p>
        </div>
      )}
    </div>
  );
}

export default SpeechTranscriptPanel;
