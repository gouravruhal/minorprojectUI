import React from 'react';
import { Cpu, MessageSquareQuote, ShieldAlert, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import './DualRiskMeterPanel.css';

export function DualRiskMeterPanel({
  voiceRisk = 0,
  contextRisk = 0,
  compositeRisk = 0,
  threatTier = 'SAFE',
  action = 'CONTINUE_MONITORING',
  analysisMode = 'dual_fusion',
  speechAnalysis = null,
  isStreaming = false
}) {
  const vRisk = Number(voiceRisk ?? 0);
  const cRisk = Number(contextRisk ?? 0);
  const fRisk = Number(compositeRisk ?? 0);

  const getTierClass = (score) => (score >= 70 ? 'tier-critical' : score >= 40 ? 'tier-warn' : 'tier-safe');

  const modeLabel = analysisMode === 'acoustic_only'
    ? 'Voice Acoustic Model'
    : analysisMode === 'context_llm_only'
    ? 'Context Intent LLM'
    : 'Dual-Model Fusion (Both)';

  return (
    <div className="dual-risk-panel card clay-card animate-fade-in" id="dual-risk-meter-section">
      <div className="panel-header-row">
        <div className="panel-title-group">
          <Activity size={18} className="text-accent" />
          <h3 className="panel-heading">Multi-Model Risk Evaluation & Threat Separation</h3>
        </div>
        <span className="badge badge-accent text-xs">
          Active Governance: {modeLabel}
        </span>
      </div>

      <div className="dual-meters-grid">
        {/* Meter 1: Voice Detection Risk */}
        <div className={`risk-subcard clay-inset ${getTierClass(vRisk)}`}>
          <div className="meter-card-header">
            <div className="flex-center gap-1">
              <Cpu size={15} className="text-accent" />
              <span className="meter-title font-bold text-xs">Voice Detection Risk</span>
            </div>
            <span className={`badge ${vRisk >= 70 ? 'badge-danger' : vRisk >= 40 ? 'badge-warning' : 'badge-safe'} text-xs`}>
              {vRisk >= 70 ? 'SYNTHETIC' : vRisk >= 40 ? 'SUSPECT' : 'AUTHENTIC'}
            </span>
          </div>

          <div className="meter-score-row">
            <span className="big-meter-val mono-metric">{vRisk.toFixed(1)}%</span>
            <div className="meter-track-bg">
              <div className="meter-fill-bar" style={{ width: `${Math.min(100, Math.max(0, vRisk))}%` }} />
            </div>
          </div>

          <div className="meter-breakdown-list text-xs text-dim">
            <div className="breakdown-item">
              <span>Physical Vocal Physics:</span>
              <span className="font-bold">{vRisk >= 50 ? 'Neural Vocoder Detected' : 'Organic Phonation'}</span>
            </div>
            <div className="breakdown-item">
              <span>Glottal Micro-Tremor:</span>
              <span className="font-bold">{vRisk >= 50 ? 'Suppressed (<0.25%)' : 'Natural (>0.50%)'}</span>
            </div>
          </div>
        </div>

        {/* Meter 2: Context & Intent Risk */}
        <div className={`risk-subcard clay-inset ${getTierClass(cRisk)}`}>
          <div className="meter-card-header">
            <div className="flex-center gap-1">
              <MessageSquareQuote size={15} className="text-warning" />
              <span className="meter-title font-bold text-xs">Context & Intent Risk</span>
            </div>
            <span className={`badge ${cRisk >= 70 ? 'badge-danger' : cRisk >= 40 ? 'badge-warning' : 'badge-safe'} text-xs`}>
              {cRisk >= 70 ? 'HIGH THREAT' : cRisk >= 40 ? 'SUSPICIOUS' : 'BENIGN'}
            </span>
          </div>

          <div className="meter-score-row">
            <span className="big-meter-val mono-metric">{cRisk.toFixed(1)}%</span>
            <div className="meter-track-bg">
              <div className="meter-fill-bar" style={{ width: `${Math.min(100, Math.max(0, cRisk))}%` }} />
            </div>
          </div>

          <div className="meter-breakdown-list text-xs text-dim">
            <div className="breakdown-item">
              <span>Flagged Fraud Phrases:</span>
              <span className="font-bold text-danger">
                {speechAnalysis?.detected_phrases ? `${speechAnalysis.detected_phrases.length} keywords` : 'None detected'}
              </span>
            </div>
            <div className="breakdown-item">
              <span>Ingress / Route Sensitivity:</span>
              <span className="font-bold">{cRisk >= 50 ? 'High-Risk Network' : 'Standard Carrier'}</span>
            </div>
          </div>
        </div>

        {/* Meter 3: Active Composite Verdict */}
        <div className={`risk-subcard clay-inset verdict-subcard ${getTierClass(fRisk)}`}>
          <div className="meter-card-header">
            <div className="flex-center gap-1">
              <ShieldAlert size={15} className="text-safe" />
              <span className="meter-title font-bold text-xs">Active Composite Risk</span>
            </div>
            <span className={`badge ${threatTier === 'CRITICAL' ? 'badge-danger' : threatTier === 'WARN' ? 'badge-warning' : 'badge-safe'} text-xs`}>
              {threatTier}
            </span>
          </div>

          <div className="meter-score-row">
            <span className="big-meter-val mono-metric">{fRisk.toFixed(1)}%</span>
            <div className="meter-track-bg">
              <div className="meter-fill-bar active-verdict-fill" style={{ width: `${Math.min(100, Math.max(0, fRisk))}%` }} />
            </div>
          </div>

          <div className="meter-breakdown-list text-xs text-dim">
            <div className="breakdown-item">
              <span>Autonomous Action:</span>
              <span className="font-bold text-accent">{action}</span>
            </div>
            <div className="breakdown-item">
              <span>Enforcement Model:</span>
              <span className="font-bold">{modeLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DualRiskMeterPanel;
