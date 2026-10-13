import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { RiskAssessmentHeader } from './features/RiskAssessmentHeader';
import { DynamicRiskMeter } from './features/DynamicRiskMeter';
import { AdaptiveThresholdProfile } from './features/AdaptiveThresholdProfile';
import { ThreatDecompositionPanel } from './features/ThreatDecompositionPanel';
import './RiskAssessmentPage.css';

export function RiskAssessmentPage({
  activeCall,
  isStreaming,
  currentRiskScore,
  onSelectPreset
}) {
  const [sensitivityProfile, setSensitivityProfile] = useState('banking_strict');

  const isCritical = currentRiskScore >= 70;
  const isSuspicious = currentRiskScore >= 35 && currentRiskScore < 70;

  return (
    <div className="risk-assessment-view animate-fade-in" id="risk-assessment-page">
      <RiskAssessmentHeader
        activeCall={activeCall}
        isCritical={isCritical}
        isSuspicious={isSuspicious}
        onSelectPreset={onSelectPreset}
      />

      <div className="risk-main-grid">
        <section className="gauge-panel card">
          <div className="panel-title-group">
            <Activity size={18} className="text-orange" />
            <h3 className="panel-heading">Real-Time Probability Engine</h3>
          </div>

          <div className="meter-wrapper">
            <DynamicRiskMeter
              riskScore={currentRiskScore}
              isStreaming={isStreaming}
            />
          </div>

          <AdaptiveThresholdProfile
            sensitivityProfile={sensitivityProfile}
            onSelectProfile={setSensitivityProfile}
          />
        </section>

        <ThreatDecompositionPanel activeCall={activeCall} />
      </div>
    </div>
  );
}

export default RiskAssessmentPage;
