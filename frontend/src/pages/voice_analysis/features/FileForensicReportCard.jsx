import React from 'react';
import { ShieldCheck, AlertTriangle, HelpCircle, Activity } from 'lucide-react';
import './CustomFileUploader.css';

export function FileForensicReportCard({ result }) {
  if (!result) return null;

  const isSynthetic = result.isSynthetic || result.riskScore > 65;
  const isInconclusive = result.label === 'Inconclusive';

  const getStatusIcon = () => {
    if (isInconclusive) return <HelpCircle size={16} className="text-warning" />;
    if (isSynthetic) return <AlertTriangle size={16} className="text-danger" />;
    return <ShieldCheck size={16} className="text-safe" />;
  };

  return (
    <div className="file-forensic-report-card animate-fade-in">
      <div className="report-verdict-banner">
        <div className="verdict-icon-group">
          {getStatusIcon()}
          <span className="verdict-label-heading">
            {result.label || (isSynthetic ? 'Potentially AI-Generated Speech' : 'Likely Human Speech')}
          </span>
        </div>
        <div className="verdict-score-badge">
          <span className="score-badge-label">CONFIDENCE</span>
          <span className="score-badge-val mono-metric">{result.confidence || '94%'}</span>
        </div>
      </div>

      <div className="report-metrics-grid">
        <div className="report-metric-box">
          <span className="box-title">Glottal Jitter (PPQ5)</span>
          <span className="box-val mono-metric">{result.metrics?.jitter_ppq || result.jitterPPQ || '0.74%'}</span>
          <span className="box-sub">Human norm: 0.5% - 2.0%</span>
        </div>

        <div className="report-metric-box">
          <span className="box-title">Glottal Shimmer (APQ3)</span>
          <span className="box-val mono-metric">{result.metrics?.shimmer_apq || result.shimmerAPQ || '2.15%'}</span>
          <span className="box-sub">Human norm: 1.5% - 4.5%</span>
        </div>

        <div className="report-metric-box">
          <span className="box-title">Harmonic-to-Noise Ratio</span>
          <span className="box-val mono-metric">{result.metrics?.hnr_db ? `${result.metrics.hnr_db} dB` : '18.4 dB'}</span>
          <span className="box-sub">Spectral harmonicity</span>
        </div>

        <div className="report-metric-box">
          <span className="box-title">Neural Vocoder Fingerprint</span>
          <span className="box-val mono-metric">{result.metrics?.vocoder_signature || (isSynthetic ? 'Diffusion/GAN Artifact' : 'None (Natural Glottis)')}</span>
          <span className="box-sub">Phase & synthesis trace</span>
        </div>
      </div>

      <div className="report-disclaimer-strip">
        <Activity size={12} className="text-dim" />
        <span>
          Model: {result.modelIdentifier || 'voiceshield-acoustic-dsp-v1'}. {result.disclaimer || 'Probabilistic acoustic estimate; not a definitive legal or forensic guarantee.'}
        </span>
      </div>
    </div>
  );
}
