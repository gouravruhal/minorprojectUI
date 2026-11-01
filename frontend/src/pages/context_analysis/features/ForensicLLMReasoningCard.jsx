import React, { useState } from 'react';
import { Bot, Check, Copy, Database, ShieldAlert, Sparkles, Terminal } from 'lucide-react';

export function ForensicLLMReasoningCard({
  contextId,
  llmModel = 'ForensicLLMReasoner-v2-NLU',
  llmReasoningSummary = '',
  actionRecommendation = 'CONTINUE_MONITORING',
  isCritical = false
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!llmReasoningSummary) return;
    navigator.clipboard?.writeText(llmReasoningSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section className="forensic-llm-reasoning-card card clay-card">
      <div className="panel-header-row">
        <div className="panel-title-group">
          <div className="llm-icon-bubble">
            <Bot size={18} className="text-accent" />
          </div>
          <div>
            <h3 className="panel-heading">Forensic LLM Reasoning & Protocol Engine</h3>
            <span className="mono-metric text-dim text-xs">Model: {llmModel}</span>
          </div>
        </div>

        <div className="flex-center gap-2">
          {contextId && (
            <span className="badge badge-neutral flex-center gap-1">
              <Database size={11} />
              <span>{contextId}</span>
            </span>
          )}
          <button
            type="button"
            className="btn-copy-chip"
            onClick={handleCopy}
            title="Copy Forensic LLM Assessment"
          >
            {copied ? <Check size={12} className="text-safe" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy Report'}</span>
          </button>
        </div>
      </div>

      <div className="llm-report-box clay-inset">
        <div className="llm-badge-header">
          <span className="flex-center gap-1 text-xs font-bold text-accent">
            <Sparkles size={12} />
            <span>NATIVE CYBER-FORENSIC REASONER</span>
          </span>
          <span className={`badge ${isCritical ? 'badge-danger' : 'badge-safe'}`}>
            {isCritical ? <ShieldAlert size={11} /> : <Terminal size={11} />}
            <span>Action: {actionRecommendation}</span>
          </span>
        </div>

        <div className="llm-summary-content">
          {llmReasoningSummary ? (
            llmReasoningSummary.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="llm-paragraph">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-dim italic">
              Awaiting LLM synthesis for this voice context session...
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default ForensicLLMReasoningCard;

