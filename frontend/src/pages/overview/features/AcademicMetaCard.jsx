import React from 'react';

export function AcademicMetaCard() {
  return (
    <div className="academic-meta-card card">
      <div className="academic-meta-content">
        <div className="meta-info-block">
          <span className="meta-block-label">Project Category:</span>
          <span className="meta-block-val">Minor Project (3rd Year, Semester 5)</span>
        </div>
        <div className="meta-info-block">
          <span className="meta-block-label">Problem Statement:</span>
          <span className="meta-block-val">Real-Time Voice Cloning Impersonation Attack Prevention</span>
        </div>
        <div className="meta-info-block">
          <span className="meta-block-label">Target Organization:</span>
          <span className="meta-block-val">All India Council for Technical Education (Cyber Security Cell)</span>
        </div>
      </div>
    </div>
  );
}
