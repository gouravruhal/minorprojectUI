import { useState, useEffect, useRef, useCallback } from 'react';
import { audioEngine } from '../audio/audio_engine';
import { SIMULATION_PRESETS } from './simulationPresets';

export { SIMULATION_PRESETS };

export function useCallSession() {
  const [activeCall, setActiveCall] = useState(SIMULATION_PRESETS[0]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamMode, setStreamMode] = useState('simulation'); // 'simulation' | 'mic'
  const [currentRiskScore, setCurrentRiskScore] = useState(SIMULATION_PRESETS[0].baseRisk);
  const [riskHistory, setRiskHistory] = useState([
    { time: '0s', score: 12 },
    { time: '1s', score: 14 },
    { time: '2s', score: 15 },
    { time: '3s', score: 13 },
    { time: '4s', score: 14 }
  ]);
  const [callDuration, setCallDuration] = useState(0);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isMfaSent, setIsMfaSent] = useState(false);
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [activeChallengePrompt, setActiveChallengePrompt] = useState(null);

  const [diagnostics, setDiagnostics] = useState({
    acousticAnomaly: SIMULATION_PRESETS[0].acousticAnomaly,
    vocoderDetected: SIMULATION_PRESETS[0].vocoderDetected,
    vocoderSignature: SIMULATION_PRESETS[0].vocoderSignature,
    jitterPPQ: SIMULATION_PRESETS[0].jitterPPQ,
    shimmerAPQ: SIMULATION_PRESETS[0].shimmerAPQ,
    bioFit: SIMULATION_PRESETS[0].bioFit,
    keywords: SIMULATION_PRESETS[0].keywords,
    contextMultiplier: SIMULATION_PRESETS[0].contextMultiplier
  });

  const timerRef = useRef(null);
  const telemetryIntervalRef = useRef(null);

  useEffect(() => {
    if (isStreaming) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isStreaming]);

  useEffect(() => {
    if (isStreaming) {
      telemetryIntervalRef.current = setInterval(() => {
        setCurrentRiskScore(() => {
          let target = activeCall.baseRisk;
          if (streamMode === 'mic') target = 18;
          const noise = (Math.random() - 0.5) * 4.5;
          const nextVal = Math.min(99, Math.max(5, Math.round(target + noise)));
          setRiskHistory((hist) => {
            const nextHist = [...hist, { time: `${hist.length}s`, score: nextVal }];
            return nextHist.slice(-20);
          });
          return nextVal;
        });
      }, 500);
    } else {
      clearInterval(telemetryIntervalRef.current);
    }
    return () => clearInterval(telemetryIntervalRef.current);
  }, [isStreaming, activeCall, streamMode]);

  const selectPreset = useCallback(async (preset) => {
    setActiveCall(preset);
    setIsFrozen(false);
    setIsMfaSent(false);
    setShowMfaModal(false);
    setCurrentRiskScore(preset.baseRisk);
    setDiagnostics({
      acousticAnomaly: preset.acousticAnomaly,
      vocoderDetected: preset.vocoderDetected,
      vocoderSignature: preset.vocoderSignature,
      jitterPPQ: preset.jitterPPQ,
      shimmerAPQ: preset.shimmerAPQ,
      bioFit: preset.bioFit,
      keywords: preset.keywords,
      contextMultiplier: preset.contextMultiplier
    });
    if (isStreaming) {
      await audioEngine.startSimulation(preset);
    }
  }, [isStreaming]);

  const startStream = useCallback(async (mode = 'simulation') => {
    setStreamMode(mode);
    if (mode === 'mic') {
      const res = await audioEngine.startMicrophone();
      if (!res.success) {
        alert('Microphone access error: ' + res.error);
        return;
      }
    } else {
      await audioEngine.startSimulation(activeCall);
    }
    setIsStreaming(true);
  }, [activeCall]);

  const stopStream = useCallback(() => {
    audioEngine.stopAll();
    setIsStreaming(false);
  }, []);

  const triggerFreeze = useCallback(() => setIsFrozen(true), []);
  const triggerMfa = useCallback(() => {
    setIsMfaSent(true);
    setShowMfaModal(true);
  }, []);
  const updateActiveCall = useCallback((updates) => {
    setActiveCall((prev) => ({ ...prev, ...updates }));
  }, []);
  const resetCallSession = useCallback(() => {
    audioEngine.stopAll();
    setIsStreaming(false);
    setIsFrozen(false);
    setIsMfaSent(false);
    setShowMfaModal(false);
    setShowAlertModal(false);
    setCallDuration(0);
    setCurrentRiskScore(activeCall.baseRisk);
  }, [activeCall.baseRisk]);

  return {
    activeCall,
    isStreaming,
    streamMode,
    currentRiskScore,
    riskHistory,
    callDuration,
    isFrozen,
    isMfaSent,
    showMfaModal,
    setShowMfaModal,
    showAlertModal,
    setShowAlertModal,
    activeChallengePrompt,
    setActiveChallengePrompt,
    diagnostics,
    selectPreset,
    startStream,
    stopStream,
    triggerFreeze,
    triggerMfa,
    updateActiveCall,
    resetCallSession
  };
}
