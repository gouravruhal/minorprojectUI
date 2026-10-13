import React from 'react';
import { OverviewPage } from '../../pages/overview/OverviewPage';
import { VoiceAnalysisPage } from '../../pages/voice_analysis/VoiceAnalysisPage';
import { ContextAnalysisPage } from '../../pages/context_analysis/ContextAnalysisPage';
import { RiskAssessmentPage } from '../../pages/risk_assessment/RiskAssessmentPage';
import { AlertsPreventionPage } from '../../pages/alerts_prevention/AlertsPreventionPage';
import { PrivacyCompliancePage } from '../../pages/privacy_compliance/PrivacyCompliancePage';

export function AppRouterView({
  activeTab,
  onNavigateTab,
  callSession
}) {
  return (
    <div key={activeTab} className="page-transition-wrapper">
      {activeTab === 'overview' && (
        <OverviewPage
          onLaunchConsole={() => onNavigateTab('voice')}
          onLaunchPipeline={() => onNavigateTab('voice')}
        />
      )}

      {activeTab === 'voice' && (
        <VoiceAnalysisPage
          activeCall={callSession.activeCall}
          isStreaming={callSession.isStreaming}
          streamMode={callSession.streamMode}
          currentRiskScore={callSession.currentRiskScore}
          callDuration={callSession.callDuration}
          isFrozen={callSession.isFrozen}
          diagnostics={callSession.diagnostics}
          onSelectPreset={callSession.selectPreset}
          onStartStream={callSession.startStream}
          onStopStream={callSession.stopStream}
          onTriggerFreeze={callSession.triggerFreeze}
          onTriggerMfa={callSession.triggerMfa}
          onUpdateActiveCall={callSession.updateActiveCall}
          onResetCallSession={callSession.resetCallSession}
        />
      )}

      {activeTab === 'context' && (
        <ContextAnalysisPage
          activeCall={callSession.activeCall}
          isStreaming={callSession.isStreaming}
          currentRiskScore={callSession.currentRiskScore}
          isFrozen={callSession.isFrozen}
          onSelectPreset={callSession.selectPreset}
          onTriggerFreeze={callSession.triggerFreeze}
          onTriggerMfa={callSession.triggerMfa}
        />
      )}

      {activeTab === 'risk' && (
        <RiskAssessmentPage
          activeCall={callSession.activeCall}
          isStreaming={callSession.isStreaming}
          currentRiskScore={callSession.currentRiskScore}
          riskHistory={callSession.riskHistory}
          onSelectPreset={callSession.selectPreset}
        />
      )}

      {activeTab === 'alerts' && (
        <AlertsPreventionPage
          activeCall={callSession.activeCall}
          isStreaming={callSession.isStreaming}
          currentRiskScore={callSession.currentRiskScore}
          isFrozen={callSession.isFrozen}
          onTriggerFreeze={callSession.triggerFreeze}
          onTriggerMfa={callSession.triggerMfa}
        />
      )}

      {activeTab === 'privacy' && <PrivacyCompliancePage />}
    </div>
  );
}

export default AppRouterView;
