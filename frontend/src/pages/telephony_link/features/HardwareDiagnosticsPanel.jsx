import React, { useState, useEffect, useCallback } from 'react';
import { Gauge, Radio, RefreshCw } from 'lucide-react';
import { getTelecomDiagnostics } from '../../../core/api/voiceAnalysisApi';

export function HardwareDiagnosticsPanel() {
  const [diagnostics, setDiagnostics] = useState([]);
  const [isPolling, setIsPolling] = useState(false);

  const fetchDiagnostics = useCallback(async () => {
    setIsPolling(true);
    try {
      const data = await getTelecomDiagnostics();
      if (Array.isArray(data) && data.length > 0) {
        setDiagnostics(data);
      }
    } finally {
      setIsPolling(false);
    }
  }, []);

  useEffect(() => {
    fetchDiagnostics();
  }, [fetchDiagnostics]);

  return (
    <div className="hardware-diagnostics-card card clay-card">
      <div className="panel-header-row">
        <div className="panel-title-group">
          <Gauge size={18} className="text-accent" />
          <h3 className="panel-heading">Hardware Tap Diagnostics & Telephony Link Status</h3>
        </div>
        <div className="flex-center gap-2">
          <span className="badge badge-safe flex-center gap-1">
            <Radio size={11} />
            <span>BRIDGE READY</span>
          </span>
          <button
            type="button"
            className="btn-clay-secondary text-xs"
            onClick={fetchDiagnostics}
            disabled={isPolling}
            title="Poll active telecom tap interface"
          >
            <RefreshCw size={12} className={isPolling ? 'spin-anim' : ''} />
            <span>{isPolling ? 'Polling...' : 'Poll Hardware'}</span>
          </button>
        </div>
      </div>

      <div className="diagnostics-grid">
        {diagnostics.map((spec, idx) => (
          <div key={idx} className="spec-metric-card clay-inset">
            <div className="spec-label-row">
              <span className="spec-label">{spec.label}</span>
              <span className="badge badge-safe text-xs">{spec.status}</span>
            </div>
            <span className="spec-value mono-metric">{spec.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HardwareDiagnosticsPanel;
