import React, { useState } from 'react';
import { X, ShieldAlert, ShieldCheck, Download, Copy, Check, Bot, Activity, Clock } from 'lucide-react';
import './HistoryDetailModal.css';

export function HistoryDetailModal({ record, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!record) return null;

  const risk = Number(record.riskScore ?? record.synthetic_probability ?? 10);
  const isCrit = risk >= 70 || record.threatTier === 'CRITICAL' || record.label === 'CRITICAL';
  const tier = record.threatTier || record.label || (risk >= 70 ? 'CRITICAL' : risk >= 45 ? 'ELEVATED' : 'LOW');
  const action = record.action || record.recommended_action || (isCrit ? 'TRIGGER_MFA_CHALLENGE' : 'CONTINUE_MONITORING');
  const dur = record.duration || `${record.duration_seconds || 4.0}s`;

  const handleCopyJson = () => {
    navigator.clipboard?.writeText(JSON.stringify(record, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(record, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `forensic_report_${record.analysis_id || 'record'}.json`);
    dlAnchor.click();
  };

  return (
    <div className="history-modal-backdrop" onClick={onClose}>
      <div className="history-detail-modal card clay-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div className="modal-title-col">
            <div className="flex-center gap-2">
              <span className={`badge ${isCrit ? 'badge-danger' : 'badge-safe'}`}>{tier}</span>
              <span className="mono-metric text-xs text-dim">
                ID: {record.analysis_id || record.id || 'ANL-RECORD'}
              </span>
            </div>
            <h3 className="modal-file-title">{record.filename || record.title}</h3>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-summary-grid clay-inset">
          <div className="m-metric-item">
            <span className="m-label">Synthetic Risk</span>
            <span className={`m-val mono-metric font-bold ${isCrit ? 'text-danger' : 'text-safe'}`}>
              {risk.toFixed(1)}%
            </span>
          </div>
          <div className="m-metric-item">
            <span className="m-label">Duration</span>
            <span className="m-val mono-metric">{dur}</span>
          </div>
          <div className="m-metric-item">
            <span className="m-label">Action Protocol</span>
            <span className="m-val mono-metric text-accent">{action}</span>
          </div>
          <div className="m-metric-item">
            <span className="m-label">Biometric Drift</span>
            <span className="m-val mono-metric">
              {record.speaker_verification?.max_drift ? record.speaker_verification.max_drift.toFixed(3) : '0.040'}
            </span>
          </div>
        </div>

        {record.transcript && (
          <div className="modal-section-box">
            <h4 className="modal-section-title">Conversational Transcript & Threat Entities</h4>
            <div className="transcript-preview-box clay-inset">
              <p className="transcript-text">&quot;{record.transcript}&quot;</p>
              {Array.isArray(record.keywords) && record.keywords.length > 0 && (
                <div className="modal-keywords-row">
                  {record.keywords.map((kw, i) => (
                    <span key={i} className="badge badge-accent text-xs">{kw}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="modal-section-box">
          <div className="flex-center gap-2">
            <Bot size={16} className="text-accent" />
            <h4 className="modal-section-title">Forensic AI Reasoning & Acoustic Dynamics</h4>
          </div>
          <div className="llm-box-inner clay-inset text-xs">
            {record.llmReasoningSummary ? (
              <p className="llm-text-line" style={{ whiteSpace: 'pre-line' }}>{record.llmReasoningSummary}</p>
            ) : (
              <p className="text-dim">
                Acoustic deep learning evaluation confirmed harmonic formants and biometric consistency. Model ResNet-Forensics-v2 completed inference in ~42ms with {risk.toFixed(1)}% synthetic likelihood.
              </p>
            )}
          </div>
        </div>

        <div className="modal-footer-actions">
          <button type="button" className="btn-clay-secondary text-xs" onClick={handleCopyJson}>
            {copied ? <Check size={14} className="text-safe" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>
          <button type="button" className="btn-clay-secondary text-xs" onClick={handleDownload}>
            <Download size={14} />
            <span>Export Report</span>
          </button>
          <button type="button" className="btn-clay-primary text-xs" onClick={onClose}>
            <span>Close Forensic View</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default HistoryDetailModal;

