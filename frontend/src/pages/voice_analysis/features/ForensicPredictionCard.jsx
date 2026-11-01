import React from 'react';
import { ShieldCheck, AlertTriangle, HelpCircle, Activity, Clock, Cpu } from 'lucide-react';
import './ForensicAnalysisView.css';

export function ForensicPredictionCard({ result }) {
  if (!result) return null;

  const isSynthetic = result.isSynthetic || (result.riskScore >= 52);
  const isInconclusive = result.label === 'Inconclusive' || (result.riskScore >= 48 && result.riskScore < 52);
  const risk = result.riskScore !== undefined ? result.riskScore : 50;

  return (
    <div className={`verdict-hero-card ${isSynthetic ? 'danger' : (isInconclusive ? 'amber' : 'safe')} animate-fade-in`}>
      <div className="verdict-top-row">
        <div className="verdict-title-group">
          {isInconclusive ? (
            <HelpCircle size={30} className="text-warning" />
          ) : isSynthetic ? (
            <AlertTriangle size={30} className="text-danger" />
          ) : (
            <ShieldCheck size={30} className="text-safe" />
          )}
          <div>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em' }}>
              Final Acoustic Classification Verdict
            </div>
            <h2 className="verdict-h2" style={{ color: isSynthetic ? '#fca5a5' : (isInconclusive ? '#fde047' : '#86efac') }}>
              {result.label || (isSynthetic ? 'Potentially AI-Generated Speech' : 'Likely Human Speech')}
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>AI SYNTHETIC RISK</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'monospace', color: isSynthetic ? '#ef4444' : (isInconclusive ? '#eab308' : '#22c55e') }}>
              {risk}%
            </div>
          </div>
          <div style={{ textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: '1rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>CONFIDENCE</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'monospace', color: '#f8fafc' }}>
              {result.confidence || `${Math.round(isSynthetic ? risk : (100 - risk))}%`}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Risk Gauge Meter */}
      <div style={{ width: '100%', height: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 3, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, Math.max(0, risk))}%`,
            background: isSynthetic ? 'linear-gradient(90deg, #f97316, #ef4444)' : 'linear-gradient(90deg, #38bdf8, #22c55e)',
            transition: 'width 0.6s ease'
          }}
        />
      </div>

      <div className="verdict-meta-grid">
        <div>
          <div style={{ color: '#64748b', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={11} /> <span>DURATION</span>
          </div>
          <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.86rem', fontFamily: 'monospace' }}>
            {result.duration || `${result.metrics?.duration_seconds || '0.0'}s`}
          </div>
        </div>
        <div>
          <div style={{ color: '#64748b', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Activity size={11} /> <span>SAMPLE RATE</span>
          </div>
          <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.86rem', fontFamily: 'monospace' }}>
            {result.codec || '16,000 Hz PCM'}
          </div>
        </div>
        <div>
          <div style={{ color: '#64748b', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Cpu size={11} /> <span>LATENCY</span>
          </div>
          <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.86rem', fontFamily: 'monospace' }}>
            {result.processingTimeMs ? `${result.processingTimeMs} ms` : '< 5 ms'}
          </div>
        </div>
        <div>
          <div style={{ color: '#64748b', fontSize: '0.72rem' }}>VOCODER SIGNATURE</div>
          <div style={{ color: isSynthetic ? '#f87171' : '#4ade80', fontWeight: 600, fontSize: '0.86rem' }}>
            {result.metrics?.vocoder_signature || (isSynthetic ? 'Neural Vocoder Phase Trace' : 'None (Natural Glottis)')}
          </div>
        </div>
      </div>
    </div>
  );
}
