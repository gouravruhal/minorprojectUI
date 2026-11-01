import React from 'react';
import { PhoneForwarded, ShieldCheck, Cable, Terminal, Wrench } from 'lucide-react';
import { HardwareCircuitDiagram } from './features/HardwareCircuitDiagram';
import { HardwareDiagnosticsPanel } from './features/HardwareDiagnosticsPanel';
import './TelephonyLinkPage.css';

export function TelephonyLinkPage() {
  const DEPLOY_STEPS = [
    {
      step: '01',
      title: 'Physical In-Line Bridging',
      desc: 'Plug RJ11 line from the wall jack into the hardware tap input, and route pass-through back into the physical IP phone or desk console.'
    },
    {
      step: '02',
      title: 'Galvanic DC Decoupling',
      desc: 'The internal 600:600Ω audio transformer isolates high PSTN ring voltages (90VAC) while capturing pristine duplex acoustic speech signals.'
    },
    {
      step: '03',
      title: 'Hardware ADC Digitization',
      desc: 'Connect USB 2.0 interface to the VoiceShield AI host machine. The audio stream is sampled at 16,000 Hz 16-bit linear PCM with sub-10ms buffer.'
    },
    {
      step: '04',
      title: 'Automated AI Defense Ingestion',
      desc: 'VoiceShield AI automatically segments customer audio into 2.0s rolling windows, calculating synthetic risk and executing automated step-up MFA if spoofed.'
    }
  ];

  return (
    <div className="telephony-link-view animate-fade-in" id="telephony-link-page">
      <header className="telephony-page-header card clay-card">
        <div className="telephony-header-left">
          <div className="header-badge-row">
            <span className="badge badge-accent flex-center gap-1">
              <PhoneForwarded size={12} />
              <span>LIVE CALL TELEPHONY BRIDGE</span>
            </span>
            <span className="badge badge-neutral">Hardware Line Interception Spec</span>
            <span className="badge badge-safe">Zero Software Footprint on PBX</span>
          </div>
          <h2 className="telephony-title">Live Call Hardware Capture</h2>
          <p className="telephony-subtitle">
            Enterprise PSTN, SIP Trunk, and PBX telephony bridge. Connects physical phone lines directly to VoiceShield AI for live acoustic deepfake interception using non-intrusive hardware audio taps.
          </p>
        </div>
      </header>

      <HardwareCircuitDiagram />

      <HardwareDiagnosticsPanel />

      <section className="deployment-guide-card card clay-card">
        <div className="panel-header-row">
          <div className="panel-title-group">
            <Wrench size={18} className="text-accent" />
            <h3 className="panel-heading">SOC Hardware Deployment & Line Tap Guide</h3>
          </div>
          <span className="badge badge-neutral">CCITT Q.552 / IEEE 802.3 Compliant</span>
        </div>

        <div className="deploy-steps-grid">
          {DEPLOY_STEPS.map((item, idx) => (
            <div key={idx} className="deploy-step-box clay-inset">
              <span className="step-num-pill mono-metric">{item.step}</span>
              <h4 className="step-title">{item.title}</h4>
              <p className="step-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default TelephonyLinkPage;

