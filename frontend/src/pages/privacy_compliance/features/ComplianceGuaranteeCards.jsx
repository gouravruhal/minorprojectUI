import React from 'react';
import { ShieldCheck, Lock, Radio } from 'lucide-react';

export function ComplianceGuaranteeCards() {
  return (
    <div className="compliance-cards-grid">
      <div className="comp-card card">
        <div className="comp-card-top">
          <ShieldCheck size={20} className="text-safe" />
          <h3 className="comp-heading">Data Minimization (Sec. 6)</h3>
        </div>
        <p className="comp-text">
          Raw voice samples are held exclusively in circular RAM buffers for 400ms and overwritten with zeros immediately upon feature extraction. Zero audio is stored to disk.
        </p>
        <span className="badge badge-safe">100% Volatile RAM Execution</span>
      </div>

      <div className="comp-card card">
        <div className="comp-card-top">
          <Lock size={20} className="text-cyan" />
          <h3 className="comp-heading">Purpose Limitation (Sec. 4)</h3>
        </div>
        <p className="comp-text">
          Speech features are computed strictly for real-time authenticity classification and fraud prevention. No biometric templates are compiled or shared with third parties.
        </p>
        <span className="badge badge-safe">Zero Cross-Use Guarantee</span>
      </div>

      <div className="comp-card card">
        <div className="comp-card-top">
          <Radio size={20} className="text-warn" />
          <h3 className="comp-heading">Telecom Codec Invariance</h3>
        </div>
        <p className="comp-text">
          Robust against Indian cellular compression standards (GSM-FR, AMR-NB, VoLTE). Eliminates false alarms caused by noisy 2G/3G network conditions.
        </p>
        <span className="badge badge-warn">Indian Telecom Calibrated</span>
      </div>
    </div>
  );
}
