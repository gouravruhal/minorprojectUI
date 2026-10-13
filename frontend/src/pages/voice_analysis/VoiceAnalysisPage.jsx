import React from 'react';
import { IngestModeSelector } from './features/IngestModeSelector';
import { IngestModeRenderer } from './features/IngestModeRenderer';
import { RealtimeVerdictBanner } from './features/RealtimeVerdictBanner';
import { LiveWaveformSection } from './features/LiveWaveformSection';
import { InspectionTelemetrySplit } from './features/InspectionTelemetrySplit';
import { useVoiceAnalysisState } from './features/useVoiceAnalysisState';
import './features/BannersAndModals.css';
import './VoiceAnalysisPage.css';

export function VoiceAnalysisPage({
  activeCall,
  isStreaming,
  streamMode,
  currentRiskScore,
  onSelectPreset,
  onStartStream,
  onStopStream,
  onUpdateActiveCall,
  onResetCallSession
}) {
  const state = useVoiceAnalysisState({
    activeCall,
    isStreaming,
    currentRiskScore,
    onSelectPreset,
    onStartStream,
    onStopStream,
    onUpdateActiveCall,
    onResetCallSession
  });

  const isCritical = currentRiskScore >= 70;
  const isDisplaySynthetic = state.ingestMode === 'upload' && state.customFileResult 
    ? state.customFileResult.isSynthetic 
    : isCritical;

  return (
    <div className="voice-analysis-console">
      <IngestModeSelector
        ingestMode={state.ingestMode}
        onSelectMode={state.setIngestMode}
        isStreaming={isStreaming}
      />

      <IngestModeRenderer
        state={state}
        activeCall={activeCall}
        isStreaming={isStreaming}
        streamMode={streamMode}
        onStartStream={onStartStream}
        onStopStream={onStopStream}
        onSelectPreset={onSelectPreset}
      />

      {isStreaming && (
        <>
          <RealtimeVerdictBanner
            isDisplaySynthetic={isDisplaySynthetic}
            isStreaming={isStreaming}
            realtimeFrame={state.realtimeFrame}
            liveConfidence={isDisplaySynthetic ? 98.4 : 96.8}
            liveSyntheticProb={isDisplaySynthetic ? (currentRiskScore || 94.2) : 5.8}
            realtimePhonemeSegment={state.realtimePhonemeSegment}
            activeCall={activeCall}
          />

          <LiveWaveformSection
            isStreaming={isStreaming}
            streamMode={streamMode}
            currentRiskScore={currentRiskScore}
            activeCall={activeCall}
            isDisplaySynthetic={isDisplaySynthetic}
          />

          <InspectionTelemetrySplit
            logs={state.callAnalysisLogs}
            logFilter={state.logFilter}
            onFilterChange={state.setLogFilter}
            copiedLogs={state.copiedLogs}
            onCopyLogs={() => {
              navigator.clipboard?.writeText(JSON.stringify(state.callAnalysisLogs, null, 2));
              state.setCopiedLogs(true);
              setTimeout(() => state.setCopiedLogs(false), 1500);
            }}
            logsContainerRef={state.logsContainerRef}
            isDisplaySynthetic={isDisplaySynthetic}
            isStreaming={isStreaming}
            liveJitter={isDisplaySynthetic ? '0.08%' : `${activeCall?.jitterPPQ || 0.74}%`}
            liveShimmer={isDisplaySynthetic ? '0.40%' : `${activeCall?.shimmerAPQ || 2.15}%`}
            liveLiveness={isDisplaySynthetic ? '12%' : '94%'}
            spectralCentroid={activeCall?.spectralCentroid || 2140}
          />
        </>
      )}
    </div>
  );
}

export default VoiceAnalysisPage;
