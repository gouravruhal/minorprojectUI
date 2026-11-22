import React, { useState } from 'react';
import { RefreshCw, Radio, CheckCircle, Database, Play, Square } from 'lucide-react';
import { useMicrophoneStream } from './features/useMicrophoneStream';
import { CallPlaybackSimulator } from '../../core/audio/callPlaybackSimulator';
import { MicLiveWaveform } from './features/MicLiveWaveform';
import { MicRiskMeter } from './features/MicRiskMeter';
import { MicTelemetryLogs } from './features/MicTelemetryLogs';
import { MicSessionTimelineChart } from './features/MicSessionTimelineChart';
import { MicContextMetadataPanel } from './features/MicContextMetadataPanel';
import { MicAutomatedResponseBanner } from './features/MicAutomatedResponseBanner';
import { MicStreamingSourceSelector } from './features/MicStreamingSourceSelector';
import { MicSecurityAlertModal } from './features/MicSecurityAlertModal';
import { SpeechTranscriptPanel } from '../../components/voice/SpeechTranscriptPanel';
import { ModelAnalysisSelector } from '../../components/voice/ModelAnalysisSelector';
import { DualRiskMeterPanel } from '../../components/voice/DualRiskMeterPanel';
import './MicrophoneAnalysisPage.css';

export function MicrophoneAnalysisPage() {
  const [streamMode, setStreamMode] = useState('mic');
  const [contextConfig, setContextConfig] = useState({
    routeType: 'cellular', transactionAmount: 0, knownContact: true, claimedIdentity: '', modelMode: 'both'
  });

  const {
    isStreaming, audioLevel, logs, latestResult, currentChunk, errorMsg, savedNotice,
    elapsedSec, wsStatus, wsLatency, activeAlert, setActiveAlert, sampleCalls,
    selectedSample, setSelectedSample, isMuted, setIsMuted, playbackProgress,
    simulatorRef, initWsClient, handleStart, handleStop, handleReset, setIsStreaming
  } = useMicrophoneStream(streamMode, contextConfig);

  const handleCustomUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const ws = initWsClient();
      simulatorRef.current = new CallPlaybackSimulator({
        onAudioLevel: () => {}, onProgress: () => {},
        onComplete: () => handleStop(), wsClient: ws
      });
      simulatorRef.current.startSimulation(e.target.result, isMuted);
      setIsStreaming(true);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="mic-analysis-view animate-fade-in" id="microphone-analysis-page">
      <header className="mic-page-header card clay-card">
        <div className="mic-header-left">
          <div className="header-badge-row">
            <span className="badge badge-accent flex-center gap-1"><Radio size={12} /><span>WS SLIDING STREAM</span></span>
            <span className="badge badge-neutral">2000ms WebSocket Slices</span>
            <span className="badge badge-safe">Zero-Disk RAM Ingestion</span>
          </div>
          <h2 className="mic-title">Real-Time Voice Clone Detection</h2>
          <p className="mic-subtitle">
            Bidirectional WebSocket audio streaming with 2-second sliding windows, multi-layer DSP feature extraction, and automated incident response triggers.
          </p>
        </div>
        <div className="mic-header-controls">
          {errorMsg && <span className="text-danger text-xs">{errorMsg}</span>}
          {isStreaming ? (
            <button type="button" className="btn-clay-danger mic-ctrl-btn" onClick={handleStop}>
              <Square size={15} /><span>Stop Stream ({elapsedSec}s)</span>
            </button>
          ) : (
            <button type="button" className="btn-clay-primary mic-ctrl-btn" onClick={handleStart}>
              <Play size={15} /><span>{streamMode === 'mic' ? 'Start Mic Stream' : 'Start Simulated Call'}</span>
            </button>
          )}
          <button type="button" className="btn-clay-secondary mic-clear-btn" onClick={handleReset} title="Reset">
            <RefreshCw size={14} /><span>Reset</span>
          </button>
        </div>
      </header>

      {savedNotice && (
        <div className="session-saved-banner card clay-card animate-fade-in">
          <div className="flex-center gap-2"><CheckCircle size={18} className="text-safe" />
            <div>
              <span className="font-bold text-sm text-main">Unified Session Persisted to History</span>
              <div className="mono-metric text-xs text-dim">ID: {savedNotice.id} • Risk: {savedNotice.risk}% ({savedNotice.tier})</div>
            </div>
          </div>
          <span className="badge badge-safe flex-center gap-1"><Database size={12} /><span>SQLite Synced</span></span>
        </div>
      )}

      <ModelAnalysisSelector
        selectedMode={contextConfig.modelMode || 'both'}
        onSelectMode={(mode) => setContextConfig((prev) => ({ ...prev, modelMode: mode }))}
        disabled={false}
      />

      <MicStreamingSourceSelector
        streamMode={streamMode} onChangeMode={setStreamMode} sampleCalls={sampleCalls}
        selectedSample={selectedSample} onSelectSample={setSelectedSample}
        onUploadCustomFile={handleCustomUpload} wsStatus={wsStatus} wsLatency={wsLatency}
        isMuted={isMuted} onToggleMute={() => { setIsMuted(!isMuted); simulatorRef.current?.setMuted(!isMuted); }}
        isStreaming={isStreaming} playbackProgress={playbackProgress}
      />

      <MicContextMetadataPanel context={contextConfig} onChangeContext={setContextConfig} isStreaming={isStreaming} />
      <MicAutomatedResponseBanner latestResult={latestResult} isStreaming={isStreaming} />

      <div className="mic-grid-top">
        <MicLiveWaveform isStreaming={isStreaming} audioLevel={audioLevel} currentChunk={currentChunk} />
        <MicRiskMeter latestResult={latestResult} isStreaming={isStreaming} />
      </div>

      <DualRiskMeterPanel
        voiceRisk={latestResult?.voiceDetectionRisk || latestResult?.voice_detection_risk}
        contextRisk={latestResult?.contextDetectionRisk || latestResult?.context_detection_risk}
        compositeRisk={latestResult?.riskScore || latestResult?.risk_score}
        threatTier={latestResult?.threatTier || latestResult?.threat_tier}
        action={latestResult?.action}
        analysisMode={latestResult?.analysisMode || contextConfig.modelMode}
        speechAnalysis={latestResult?.speech_text_analysis || latestResult?.speechTextAnalysis}
        isStreaming={isStreaming}
      />

      <SpeechTranscriptPanel
        speechAnalysis={latestResult?.speech_text_analysis || latestResult?.speechTextAnalysis}
        isStreaming={isStreaming}
      />

      <MicSessionTimelineChart logs={logs} isStreaming={isStreaming} durationSec={elapsedSec} />
      <MicTelemetryLogs logs={logs} />
      <MicSecurityAlertModal alert={activeAlert} onClose={() => setActiveAlert(null)} />
    </div>
  );
}

export default MicrophoneAnalysisPage;
