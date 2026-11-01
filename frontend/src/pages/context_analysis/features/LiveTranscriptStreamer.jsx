import React from 'react';
import { MessageSquare, Tag, AlertTriangle, CheckCircle2, Bot, Sparkles } from 'lucide-react';

export function LiveTranscriptStreamer({ recording, activeCall, isStreaming, isRegenerating }) {
  const current = recording || activeCall || {};
  const transcriptText = current.transcript || current.transcriptSnippet || 'Awaiting incoming telephonic stream...';
  const keywords = current.keywords || [];

  const highlightKeywords = (text, kws) => {
    if (!kws || kws.length === 0) return text;
    const regex = new RegExp(`(${kws.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => {
      const isMatch = kws.some((k) => k.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        return (
          <mark key={index} className="threat-keyword-highlight">
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  return (
    <section className="transcript-panel card clay-card">
      <div className="panel-header-row">
        <div className="panel-title-group">
          <MessageSquare size={18} className="text-accent" />
          <h3 className="panel-heading">Voice-to-Text Speech Transcript</h3>
        </div>
        <span className="mono-metric stream-status-tag">
          {isRegenerating ? (
            <span className="text-warning animate-pulse"><Sparkles size={12} /> TRANSCRIBING...</span>
          ) : isStreaming ? (
            <span className="text-danger">● LISTENING (LATENCY &lt;280ms)</span>
          ) : (
            <span className="text-dim">STANDBY &bull; PROCESSED</span>
          )}
        </span>
      </div>

      <div className="transcript-box">
        <div className="transcript-meta-bar">
          <span className="caller-id-pill">
            Speaker: <strong>{current.callerName || 'Unknown Speaker'}</strong> ({current.network || 'Standard PSTN'})
          </span>
          <span className="timestamp-pill">
            {current.intentCategory ? (
              <span className="intent-badge-pill"><Bot size={12} /> {current.intentCategory}</span>
            ) : 'Live Capture'}
          </span>
        </div>

        <div className={`transcript-bubble ${isRegenerating ? 'shimmer-loading' : ''}`}>
          <p className="transcript-text">
            "{highlightKeywords(transcriptText, keywords)}"
          </p>
        </div>
      </div>

      <div className="threat-entities-section">
        <h4 className="entities-title">
          <Tag size={14} className="text-accent" />
          <span>Extracted Threat Intent & Red-Flag Entities</span>
        </h4>
        <div className="entity-tags-list">
          {keywords && keywords.length > 0 ? (
            keywords.map((kw, idx) => (
              <span key={idx} className={`entity-tag ${current.isSynthetic ? 'danger' : 'safe'}`}>
                {current.isSynthetic ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                <span>{kw}</span>
              </span>
            ))
          ) : (
            <span className="entity-tag safe">
              <CheckCircle2 size={12} />
              <span>No coercive or malicious entities detected</span>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

export default LiveTranscriptStreamer;
