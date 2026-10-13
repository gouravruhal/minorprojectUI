import React from 'react';
import { Zap } from 'lucide-react';
import { ContextAnalysisHeader } from './features/ContextAnalysisHeader';
import { LiveTranscriptStreamer } from './features/LiveTranscriptStreamer';
import { LinguisticThreatTelemetry } from './features/LinguisticThreatTelemetry';
import { MultiModalFusionBreakdown } from './features/MultiModalFusionBreakdown';
import { InterventionControlBar } from './features/InterventionControlBar';
import './ContextAnalysisPage.css';

export function ContextAnalysisPage({
  activeCall,
  isStreaming,
  currentRiskScore,
  isFrozen,
  onSelectPreset,
  onTriggerFreeze,
  onTriggerMfa
}) {
  const linguisticScore = Math.min(99, Math.round(activeCall.baseRisk * (activeCall.contextMultiplier || 1.1)));
  const isCritical = activeCall.category === 'critical' || currentRiskScore >= 70;

  return (
    <div className="context-analysis-view animate-fade-in" id="context-analysis-page">
      <ContextAnalysisHeader
        activeCall={activeCall}
        isCritical={isCritical}
        onSelectPreset={onSelectPreset}
      />

      <div className="context-main-grid">
        <LiveTranscriptStreamer
          activeCall={activeCall}
          isStreaming={isStreaming}
        />

        <section className="nlp-telemetry-panel card">
          <div className="panel-header-row">
            <div className="panel-title-group">
              <Zap size={18} className="text-orange" />
              <h3 className="panel-heading">Linguistic Threat Telemetry</h3>
            </div>
            <span className="badge badge-neutral">GPT/RoBERTa-Fraud-v4</span>
          </div>

          <LinguisticThreatTelemetry
            linguisticScore={linguisticScore}
            isCritical={isCritical}
          />

          <MultiModalFusionBreakdown
            activeCall={activeCall}
            linguisticScore={linguisticScore}
            currentRiskScore={currentRiskScore}
            isCritical={isCritical}
          />

          <InterventionControlBar
            isFrozen={isFrozen}
            onTriggerFreeze={onTriggerFreeze}
            onTriggerMfa={onTriggerMfa}
          />
        </section>
      </div>
    </div>
  );
}

export default ContextAnalysisPage;
