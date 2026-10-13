import React, { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { SAMPLE_AUDIT_LOGS } from './complianceAuditData';

export function AuditLogTable() {
  const [downloaded, setDownloaded] = useState(false);

  const downloadFullAuditLog = () => {
    const data = {
      standard: 'Digital Personal Data Protection (DPDP) Act 2023 Compliance Trail',
      framework: 'VoiceShield AI Enterprise Voice Defense',
      exportedAt: new Date().toISOString(),
      privacyGuarantee: 'Zero raw voice audio retained on persistent storage. RAM buffers discarded in <400ms.',
      records: SAMPLE_AUDIT_LOGS
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VoiceShield_DPDP_Audit_Log_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="audit-table-card card">
      <div className="table-card-header">
        <div className="table-title-group">
          <FileText size={18} className="text-cyan" />
          <h3 className="table-heading">Session Authenticity & Intervention Log</h3>
        </div>

        <button
          id="download-full-audit-btn"
          className="btn-outline export-log-btn"
          onClick={downloadFullAuditLog}
        >
          <Download size={15} />
          <span>{downloaded ? 'Audit Log Downloaded' : 'Export Compliance JSON'}</span>
        </button>
      </div>

      <div className="table-wrapper">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Session ID</th>
              <th>Timestamp</th>
              <th>Claimed Caller</th>
              <th>Network Channel</th>
              <th>Peak Risk</th>
              <th>Classification</th>
              <th>Automated Action</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_AUDIT_LOGS.map((log, idx) => (
              <tr key={idx}>
                <td className="mono-metric session-cell">{log.sessionId}</td>
                <td className="mono-metric timestamp-cell">{log.timestamp}</td>
                <td className="caller-cell">{log.caller}</td>
                <td className="mono-metric channel-cell">{log.channel}</td>
                <td className="mono-metric">
                  <span className={`risk-pill ${parseInt(log.peakRisk) >= 70 ? 'pill-danger' : 'pill-safe'}`}>
                    {log.peakRisk}
                  </span>
                </td>
                <td>
                  <span className={`badge ${log.verdict === 'CRITICAL_SPOOF' ? 'badge-danger' : 'badge-safe'}`}>
                    {log.verdict}
                  </span>
                </td>
                <td className="action-cell">{log.actionTaken}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
