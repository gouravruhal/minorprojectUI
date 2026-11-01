import React from 'react';
import { PhoneCall, Cable, Cpu, Server, ShieldCheck, ArrowRight } from 'lucide-react';

export function HardwareCircuitDiagram() {
  const NODES = [
    {
      title: '1. PSTN / PBX Line',
      desc: 'RJ11 / FXO Dual-Wire Tip & Ring (-48V DC Carrier)',
      icon: PhoneCall,
      tag: 'Physical Ingress'
    },
    {
      title: '2. Galvanic Isolator',
      desc: '600Ω Audio Transformer + 250V DC Decoupling',
      icon: Cable,
      tag: 'Circuit Protection'
    },
    {
      title: '3. Stereo Ingress ADC',
      desc: '24-Bit / 16kHz PCM Hardware Digitizer Bridge',
      icon: Cpu,
      tag: 'Signal Sampling'
    },
    {
      title: '4. VoiceShield AI Host',
      desc: 'Low-latency Ring Buffer & Neural Ingestion',
      icon: Server,
      tag: 'AI Forensic Core'
    }
  ];

  return (
    <div className="hardware-diagram-card card clay-card">
      <div className="panel-header-row">
        <div className="panel-title-group">
          <Cable size={18} className="text-accent" />
          <h3 className="panel-heading">In-Line Hardware Interception Flow</h3>
        </div>
        <span className="badge badge-accent">Non-Intrusive Audio Tap Topology</span>
      </div>

      <div className="circuit-nodes-flow">
        {NODES.map((node, idx) => {
          const Icon = node.icon;
          return (
            <React.Fragment key={idx}>
              <div className="circuit-node-box clay-card">
                <div className="node-icon-bubble">
                  <Icon size={20} />
                </div>
                <div className="node-info">
                  <span className="badge badge-neutral text-xs">{node.tag}</span>
                  <h4 className="node-title">{node.title}</h4>
                  <p className="node-desc">{node.desc}</p>
                </div>
              </div>
              {idx < NODES.length - 1 && (
                <div className="circuit-flow-arrow">
                  <ArrowRight size={18} className="text-accent" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default HardwareCircuitDiagram;

