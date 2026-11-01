import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, RefreshCw, Radio, CheckCircle, Database } from 'lucide-react';
import { startMicStream, stopMicStream } from '../../core/audio/micChunkRecorder';
import { analyzeAudioEnterprise } from '../../core/api/voiceAnalysisApi';
import { saveVoiceAnalysisRecord } from '../../core/state/contextAnalysisStore';
import { MicLiveWaveform } from './features/MicLiveWaveform';
import { MicRiskMeter } from './features/MicRiskMeter';
import { MicTelemetryLogs } from './features/MicTelemetryLogs';
import { MicSessionTimelineChart } from './features/MicSessionTimelineChart';
import './MicrophoneAnalysisPage.css';

export function MicrophoneAnalysisPage() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [logs, setLogs] = useState([]);
  const [latestResult, setLatestResult] = useState(null);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const timerRef = useRef(null);

  const handleStart = async () => {
    setErrorMsg('');
    setSavedNotice(null);
    setElapsedSec(0);

    const res = await startMicStream(
      (chunkData) => {
        setLatestResult(chunkData);
        setCurrentChunk(chunkData.chunkId);
        setLogs((prev) => [chunkData, ...prev]);
      },
      (level) => setAudioLevel(level)
    );

    if (res.success) {
      setIsStreaming(true);
      timerRef.current = setInterval(() => {
        setElapsedSec((prev) => prev + 1);
      }, 1000);
    } else {
      setErrorMsg(res.error || 'Failed to access microphone. Please allow microphone permissions.');
      setIsStreaming(false);
    }
  };

  const handleStop = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const sessionData = stopMicStream();
    setIsStreaming(false);
    setAudioLevel(0);

    if (sessionData && sessionData.fullBlob) {
      setIsSaving(true);
      try {
        const file = new File(
          [sessionData.fullBlob],
          `live_mic_session_${Date.now()}.wav`,
          { type: 'audio/wav' }
        );
        const res = await analyzeAudioEnterprise(file, { callerId: 'LAPTOP_MIC_SESSION' });
        if (res) {
          saveVoiceAnalysisRecord({
            analysisId: res.analysis_id,
            filename: res.filename || file.name,
            duration: `${res.duration_sec || sessionData.durationSec}s`,
            riskScore: res.final_risk_score,
            threatTier: res.final_threat_tier,
            speaker_verification: res.speaker_verification
          });
          setSavedNotice({
            id: res.analysis_id,
            duration: res.duration_sec || sessionData.durationSec,
            risk: res.final_risk_score,
            tier: res.final_threat_tier
          });
        }
      } catch (err) {
        console.warn('Failed to save continuous mic session to DB:', err);
      } finally {
        setIsSaving(false);
      }
    }
  }, []);

  const handleReset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopMicStream();
    setIsStreaming(false);
    setAudioLevel(0);
    setLogs([]);
    setLatestResult(null);
    setCurrentChunk(0);
    setSavedNotice(null);
    setElapsedSec(0);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopMicStream();
    };
  }, []);

  return (
    <div className="mic-analysis-view animate-fade-in" id="microphone-analysis-page">
      <header className="mic-page-header card clay-card">
        <div className="mic-header-left">
          <div className="header-badge-row">
            <span className="badge badge-accent flex-center gap-1">
              <Radio size={12} />
              <span>LIVE HARDWARE SENSOR</span>
            </span>
            <span className="badge badge-neutral">2000ms Rolling Inference Windows</span>
            <span className="badge badge-safe">Real-Time Backend Neural Ingestion</span>
          </div>
          <h2 className="mic-title">Microphone Analysis</h2>
          <p className="mic-subtitle">
            Speak into your laptop or play an AI recording from your phone. VoiceShield AI continuously records and evaluates 2-second windows, updating the live risk trajectory chart and persisting the unified session into SQLite history upon stopping.
          </p>
        </div>

        <div className="mic-header-controls">
          {errorMsg && <span className="text-danger text-xs">{errorMsg}</span>}
          {isStreaming ? (
            <button type="button" className="btn-clay-danger mic-ctrl-btn" onClick={handleStop}>
              <MicOff size={16} />
              <span>Stop Monitoring ({elapsedSec}s)</span>
            </button>
          ) : (
            <button type="button" className="btn-clay-primary mic-ctrl-btn" onClick={handleStart} disabled={isSaving}>
              <Mic size={16} />
              <span>{isSaving ? 'Saving to Database...' : 'Start Microphone Analysis'}</span>
            </button>
          )}

          <button type="button" className="btn-clay-secondary mic-clear-btn" onClick={handleReset} title="Reset session & charts">
            <RefreshCw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </header>

      {savedNotice && (
        <div className="session-saved-banner card clay-card animate-fade-in">
          <div className="flex-center gap-2">
            <CheckCircle size={18} className="text-safe" />
            <div>
              <span className="font-bold text-sm text-main">
                Unified Recording Session Successfully Persisted to SQLite History
              </span>
              <div className="mono-metric text-xs text-dim">
                ID: {savedNotice.id} • Duration: {savedNotice.duration}s • Overall Risk: {savedNotice.risk}% ({savedNotice.tier})
              </div>
            </div>
          </div>
          <span className="badge badge-safe flex-center gap-1">
            <Database size={12} />
            <span>Synced to Database</span>
          </span>
        </div>
      )}

      <div className="mic-grid-top">
        <MicLiveWaveform isStreaming={isStreaming} audioLevel={audioLevel} currentChunk={currentChunk} />
        <MicRiskMeter latestResult={latestResult} isStreaming={isStreaming} />
      </div>

      <MicSessionTimelineChart logs={logs} isStreaming={isStreaming} durationSec={elapsedSec} />

      <MicTelemetryLogs logs={logs} />
    </div>
  );
}

export default MicrophoneAnalysisPage;
