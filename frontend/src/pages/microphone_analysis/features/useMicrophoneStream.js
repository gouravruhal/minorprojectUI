import { useState, useEffect, useCallback, useRef } from 'react';
import { startMicStream, stopMicStream } from '../../../core/audio/micChunkRecorder';
import { LiveCallWebSocketClient } from '../../../core/audio/liveCallWebSocketClient';
import { CallPlaybackSimulator } from '../../../core/audio/callPlaybackSimulator';
import { analyzeAudioEnterprise } from '../../../core/api/voiceAnalysisApi';
import { saveVoiceAnalysisRecord } from '../../../core/state/contextAnalysisStore';

export function useMicrophoneStream(streamMode, contextConfig) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [logs, setLogs] = useState([]);
  const [latestResult, setLatestResult] = useState(null);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [savedNotice, setSavedNotice] = useState(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [wsStatus, setWsStatus] = useState('DISCONNECTED');
  const [wsLatency, setWsLatency] = useState(0);
  const [activeAlert, setActiveAlert] = useState(null);
  const [sampleCalls, setSampleCalls] = useState([]);
  const [selectedSample, setSelectedSample] = useState('ai_sample_1.wav');
  const [isMuted, setIsMuted] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(null);

  const timerRef = useRef(null);
  const contextRef = useRef(contextConfig);
  const wsClientRef = useRef(null);
  const simulatorRef = useRef(null);

  useEffect(() => {
    contextRef.current = contextConfig;
    if (wsClientRef.current) {
      wsClientRef.current.sendConfig(contextConfig);
    }
  }, [contextConfig]);

  useEffect(() => {
    fetch('/api/v1/sample-calls')
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setSampleCalls(d))
      .catch(() => {});
  }, []);

  const initWsClient = useCallback(() => {
    if (wsClientRef.current) wsClientRef.current.disconnect();
    const client = new LiveCallWebSocketClient({
      onFrame: (frame) => {
        setLatestResult(frame);
        setCurrentChunk(frame.chunkId);
        setLogs((prev) => [frame, ...prev]);
        setWsLatency(frame.clientLatencyMs || 22);
      },
      onAlert: (alert) => setActiveAlert(alert),
      onStatusChange: (status, lat) => { setWsStatus(status); if (lat) setWsLatency(lat); }
    });
    wsClientRef.current = client;
    client.connect(`stream_${Date.now()}`, contextRef.current);
    return client;
  }, []);

  const handleStart = async () => {
    setErrorMsg(''); setSavedNotice(null); setElapsedSec(0); setActiveAlert(null);
    const ws = initWsClient();

    if (streamMode === 'mic') {
      const res = await startMicStream(
        (chunk) => {
          setLatestResult(chunk); setCurrentChunk(chunk.chunkId);
          setLogs((p) => [chunk, ...p]);
        },
        (lvl) => setAudioLevel(lvl),
        () => contextRef.current
      );
      if (res.success) {
        setIsStreaming(true);
        timerRef.current = setInterval(() => setElapsedSec((p) => p + 1), 1000);
      } else {
        setErrorMsg(res.error || 'Failed to access mic.');
        setIsStreaming(false);
        ws.disconnect();
      }
    } else {
      try {
        const audioRes = await fetch(`/api/v1/sample-calls/${selectedSample}/audio`);
        const arrayBuf = await audioRes.arrayBuffer();
        simulatorRef.current = new CallPlaybackSimulator({
          onAudioLevel: (lvl) => setAudioLevel(lvl),
          onProgress: (cur, tot) => setPlaybackProgress({ currentSec: cur, totalSec: tot }),
          onComplete: () => handleStop(),
          wsClient: ws
        });
        await simulatorRef.current.startSimulation(arrayBuf, isMuted);
        setIsStreaming(true);
        timerRef.current = setInterval(() => setElapsedSec((p) => p + 1), 1000);
      } catch (err) {
        setErrorMsg('Failed to load sample call audio: ' + err.message);
      }
    }
  };

  const handleStop = useCallback(async () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (simulatorRef.current) { simulatorRef.current.stopSimulation(); simulatorRef.current = null; }
    const sessionData = stopMicStream();
    if (wsClientRef.current) { wsClientRef.current.disconnect(); wsClientRef.current = null; }
    setIsStreaming(false); setAudioLevel(0); setPlaybackProgress(null);

    if (sessionData?.fullBlob) {
      try {
        const file = new File([sessionData.fullBlob], `mic_session_${Date.now()}.wav`, { type: 'audio/wav' });
        const res = await analyzeAudioEnterprise(file, {
          callerId: 'LAPTOP_MIC_SESSION', route_type: contextRef.current.routeType,
          transaction_amount: contextRef.current.transactionAmount, known_contact: contextRef.current.knownContact,
          claimed_identity: contextRef.current.claimedIdentity
        });
        if (res) {
          saveVoiceAnalysisRecord({
            analysisId: res.analysis_id, filename: res.filename || file.name,
            duration: `${res.duration_sec || sessionData.durationSec}s`, riskScore: res.final_risk_score,
            threatTier: res.final_threat_tier, speaker_verification: res.speaker_verification
          });
          setSavedNotice({ id: res.analysis_id, duration: res.duration_sec, risk: res.final_risk_score, tier: res.final_threat_tier });
        }
      } catch (err) { console.warn('Save session err:', err); }
    }
  }, []);

  const handleReset = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (simulatorRef.current) { simulatorRef.current.stopSimulation(); simulatorRef.current = null; }
    if (wsClientRef.current) { wsClientRef.current.disconnect(); wsClientRef.current = null; }
    stopMicStream();
    setIsStreaming(false); setAudioLevel(0); setLogs([]); setLatestResult(null);
    setCurrentChunk(0); setSavedNotice(null); setElapsedSec(0); setPlaybackProgress(null);
    setActiveAlert(null);
  }, []);

  return {
    isStreaming, audioLevel, logs, latestResult, currentChunk, errorMsg, savedNotice,
    elapsedSec, wsStatus, wsLatency, activeAlert, setActiveAlert, sampleCalls,
    selectedSample, setSelectedSample, isMuted, setIsMuted, playbackProgress,
    simulatorRef, initWsClient, handleStart, handleStop, handleReset, setIsStreaming
  };
}
