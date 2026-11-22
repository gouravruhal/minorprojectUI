import React from 'react';
import { ExternalLink, Database, Cpu, Zap, ShieldAlert } from 'lucide-react';

const ENDPOINTS = [
  {
    method: 'POST',
    path: '/api/v1/analyze-audio',
    protocol: 'REST / Multipart',
    summary: 'Zero-Disk In-Memory RAM Multi-Layer DSP & 4-Factor Risk Ingress',
    latency: '< 45 ms',
    spec: 'Caller ID, VoIP/Cellular route, >50k transaction flag, claimed VIP ID.'
  },
  {
    method: 'WS',
    path: '/ws/live-call/{call_id}',
    protocol: 'WebSocket Full-Duplex',
    summary: 'Real-Time 2.0s Sliding Window Stream with Instant SECURITY_ALERT Triggers',
    latency: '< 25 ms',
    spec: 'PCM 16kHz audio stream, frame telemetry, within-call speaker drift.'
  },
  {
    method: 'POST',
    path: '/api/v1/security/challenge-mfa',
    protocol: 'REST / JSON',
    summary: 'Automated Incident Mitigation: Cryptographic Step-Up MFA Challenge',
    latency: '< 10 ms',
    spec: 'Dispatches high-security OTP token when composite risk >= 70%.'
  },
  {
    method: 'POST',
    path: '/api/v1/security/verify-mfa',
    protocol: 'REST / JSON',
    summary: 'MFA Token Resolution: Authenticates Caller & Lowers Threat Tier to SAFE',
    latency: '< 10 ms',
    spec: 'Validates 6-digit cryptographic challenge response.'
  },
  {
    method: 'GET',
    path: '/api/voice-analysis/telecom/diagnostics',
    protocol: 'REST / JSON',
    summary: 'SOC Telephony Hardware Tap Diagnostics & CCITT Q.552 Loop Status',
    latency: '< 5 ms',
    spec: 'Returns -48.2V loop voltage, ADC sample sync, optical galvanic isolation.'
  },
  {
    method: 'GET',
    path: '/api/v1/sample-calls',
    protocol: 'REST / JSON',
    summary: 'Catalog of Pre-Enrolled Ground Truth Human & Neural Vocoder Synthetic Audio',
    latency: '< 15 ms',
    spec: 'Retrieves sample calls catalog for simulation and acoustic verification.'
  }
];

export function SdkEndpointsTable() {
  return (
    <div className="sdk-endpoints-card card clay-card">
      <div className="panel-header-row">
        <div className="panel-title-group">
          <Database size={18} className="text-accent" />
          <h3 className="panel-heading">Live API Endpoints & Specification Matrix</h3>
        </div>
        <div className="flex-center gap-2">
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-clay-secondary text-xs flex-center gap-1"
          >
            <span>Swagger UI</span>
            <ExternalLink size={12} />
          </a>
          <a
            href="http://localhost:8000/redoc"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-clay-secondary text-xs flex-center gap-1"
          >
            <span>ReDoc</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      <div className="endpoints-table-container clay-inset">
        <table className="endpoints-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Endpoint Path</th>
              <th>Protocol</th>
              <th>Description & Ingress Specs</th>
              <th>Target Latency</th>
            </tr>
          </thead>
          <tbody>
            {ENDPOINTS.map((ep, idx) => (
              <tr key={idx}>
                <td>
                  <span className={`method-badge ${ep.method === 'WS' ? 'method-ws' : 'method-post'}`}>
                    {ep.method}
                  </span>
                </td>
                <td className="mono-metric font-bold text-accent text-xs">
                  {ep.path}
                </td>
                <td>
                  <span className="badge badge-neutral text-xs">{ep.protocol}</span>
                </td>
                <td>
                  <div className="ep-summary-col">
                    <span className="ep-title font-semibold">{ep.summary}</span>
                    <span className="ep-spec text-dim text-xs">{ep.spec}</span>
                  </div>
                </td>
                <td>
                  <span className="mono-metric text-safe text-xs font-bold">
                    {ep.latency}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SdkEndpointsTable;
