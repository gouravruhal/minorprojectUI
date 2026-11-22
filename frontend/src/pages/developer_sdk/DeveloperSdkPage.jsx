import React from 'react';
import { Terminal, Code, Cpu, ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import { SdkCodeSnippets } from './features/SdkCodeSnippets';
import { SdkEndpointsTable } from './features/SdkEndpointsTable';
import './DeveloperSdkPage.css';

export function DeveloperSdkPage() {
  return (
    <div className="developer-sdk-view animate-fade-in" id="developer-sdk-page">
      <header className="sdk-page-header card clay-card">
        <div className="sdk-header-left">
          <div className="header-badge-row">
            <span className="badge badge-accent flex-center gap-1">
              <Code size={12} />
              <span>DEVELOPER API & SDK PORTAL</span>
            </span>
            <span className="badge badge-safe">OpenAPI 3.1 & Swagger Docs</span>
            <span className="badge badge-neutral">Zero Disk Writes (RAM Only)</span>
            <span className="badge badge-accent">Sub-45ms Inference Latency</span>
          </div>
          <h2 className="sdk-title">Enterprise API & SDK Integration</h2>
          <p className="sdk-subtitle">
            Integrate VoiceShield AI directly into your PBX phone switches, contact centers, mobile apps, or enterprise security operations center (SOC). Deploy multi-layer acoustic deepfake detection via low-latency REST and WebSocket interfaces.
          </p>
        </div>

        <div className="sdk-header-actions">
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-clay-primary flex-center gap-1"
          >
            <span>Open Swagger UI</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </header>

      <div className="sdk-stats-grid">
        <div className="sdk-stat-card clay-inset">
          <div className="stat-label-row">
            <span className="stat-label">Privacy Architecture</span>
            <ShieldCheck size={14} className="text-safe" />
          </div>
          <span className="stat-val">100% In-Memory RAM</span>
          <span className="stat-hint text-dim text-xs">Zero audio files written to disk</span>
        </div>

        <div className="sdk-stat-card clay-inset">
          <div className="stat-label-row">
            <span className="stat-label">Streaming Sliding Window</span>
            <Zap size={14} className="text-accent" />
          </div>
          <span className="stat-val">2.0s Rolling Frame</span>
          <span className="stat-hint text-dim text-xs">Bi-directional WebSocket protocol</span>
        </div>

        <div className="sdk-stat-card clay-inset">
          <div className="stat-label-row">
            <span className="stat-label">Multi-Layer Risk Engine</span>
            <Cpu size={14} className="text-warning" />
          </div>
          <span className="stat-val">4-Factor Weighted (0-100)</span>
          <span className="stat-hint text-dim text-xs">50% Model + 20% DSP + 15% VIP + 15% Context</span>
        </div>
      </div>

      <SdkCodeSnippets />

      <SdkEndpointsTable />
    </div>
  );
}

export default DeveloperSdkPage;
