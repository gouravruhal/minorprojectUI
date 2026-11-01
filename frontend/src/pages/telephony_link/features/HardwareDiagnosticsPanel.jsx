import React, { useState } from 'react';
import { Gauge, CheckCircle2, RefreshCw, Radio, Power } from 'lucide-react';

export function HardwareDiagnosticsPanel() {
  const [isSimulating, setIsSimulating] = useState(false);

  const SPECS = [
    { label: 'Ingress Interface', value: 'COM4 / USB-Audio-Tap-01 (UAC2)', status: 'Connected' },
    { label: 'Line Standby Voltage', value: '-48.2 VDC (Standard On-Hook)', status: 'Optimal' },
    { label: 'Off-Hook Detection', value: '9.4 VDC Loop Active', status: 'In-Call' },
    { label: 'Sampling Pipeline', value: '16,000 Hz / 16-Bit Mono Linear PCM', status: 'Synchronized' },
    { label: 'Hardware Buffer Latency', value: '< 8.4 ms Ring Latency', status: 'Ultra-Low' },
    { label: 'Isolation Rating', value: '3,000 Vrms Galvanic Optical Barrier', status: 'Protected' }
  ];

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
            onClick={() => {
              setIsSimulating(true);
              setTimeout(() => setIsSimulating(false), 900);
            }}
          >
            <RefreshCw size={12} className={isSimulating ? 'spin-anim' : ''} />
            <span>Poll Hardware</span>
          </button>
        </div>
      </div>

      <div className="diagnostics-grid">
        {SPECS.map((spec, idx) => (
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

