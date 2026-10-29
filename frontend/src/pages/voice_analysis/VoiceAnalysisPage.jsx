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

  const isUploadMode = state.ingestMode === 'upload';
  const customRes = state.fileAnalysis.customFileResult;
  const liveRes = state.backendStream.liveResult;
  const isCritical = currentRiskScore >= 70;
  const isDisplaySynthetic = isUploadMode && customRes 
    ? customRes.isSynthetic 
    : liveRes ? liveRes.is_synthetic : isCritical;

  return (
    <div className="voice-analysis-console">
      <IngestModeSelector
        ingestMode={state.ingestMode}
        onSelectMode={state.setIngestMode}
        isStreaming={isStreaming}
        onStopStream={onStopStream}
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
            label={liveRes?.label || customRes?.label}
            isDisplaySynthetic={isDisplaySynthetic}
            isStreaming={isStreaming}
            realtimeFrame={state.realtimeFrame}
            liveConfidence={liveRes?.confidence ? Math.round(liveRes.confidence * 100) : (isDisplaySynthetic ? 98.4 : 96.8)}
            liveSyntheticProb={liveRes?.synthetic_probability !== undefined ? liveRes.synthetic_probability : (isDisplaySynthetic ? (currentRiskScore || 94.2) : 5.8)}
            realtimePhonemeSegment={state.realtimePhonemeSegment}
            modelIdentifier={liveRes?.model_identifier || customRes?.modelIdentifier || 'voiceshield-acoustic-dsp-v1'}
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
            liveJitter={liveRes?.metrics?.jitter_ppq ? `${liveRes.metrics.jitter_ppq}%` : isDisplaySynthetic ? '0.08%' : `${activeCall?.jitterPPQ || 0.74}%`}
            liveShimmer={liveRes?.metrics?.shimmer_apq ? `${liveRes.metrics.shimmer_apq}%` : isDisplaySynthetic ? '0.40%' : `${activeCall?.shimmerAPQ || 2.15}%`}
            liveLiveness={isDisplaySynthetic ? '12%' : '94%'}
            spectralCentroid={liveRes?.metrics?.spectral_centroid || activeCall?.spectralCentroid || 2140}
          />
        </>
      )}
    </div>
  );
}

export default VoiceAnalysisPage;
