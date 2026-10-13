import React from 'react';
import { MessageSquare, Tag, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function LiveTranscriptStreamer({ activeCall, isStreaming }) {
  const highlightKeywords = (text, keywords) => {
    if (!keywords || keywords.length === 0) return text;
    const regex = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => {
      const isMatch = keywords.some(k => k.toLowerCase() === part.toLowerCase());
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
    <section className="transcript-panel card">
      <div className="panel-header-row">
        <div className="panel-title-group">
          <MessageSquare size={18} className="text-orange" />
          <h3 className="panel-heading">Live Telephonic Transcript Stream</h3>
        </div>
        <span className="mono-metric stream-status-tag">
          {isStreaming ? '● LISTENING (LATENCY <280ms)' : 'STANDBY'}
        </span>
      </div>

      <div className="transcript-box">
        <div className="transcript-meta-bar">
          <span className="caller-id-pill">
            Speaker: <strong>{activeCall.callerName}</strong> ({activeCall.network})
          </span>
          <span className="timestamp-pill">Live Capture</span>
        </div>

        <div className="transcript-bubble">
          <p className="transcript-text">
            "{highlightKeywords(activeCall.transcriptSnippet, activeCall.keywords)}"
          </p>
        </div>
      </div>

      <div className="threat-entities-section">
        <h4 className="entities-title">
          <Tag size={14} className="text-orange" />
          <span>Extracted Threat Intent & Red-Flag Entities</span>
        </h4>
        <div className="entity-tags-list">
          {activeCall.keywords && activeCall.keywords.length > 0 ? (
            activeCall.keywords.map((kw, idx) => (
              <span key={idx} className="entity-tag danger">
                <AlertTriangle size={12} />
                <span>{kw}</span>
              </span>
            ))
          ) : (
            <span className="entity-tag safe">
              <CheckCircle2 size={12} />
              <span>No high-risk keywords detected</span>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
