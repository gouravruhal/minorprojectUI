import { useState, useEffect, useRef, useCallback } from 'react';
import { audioEngine } from '../audio/audio_engine';

export const SIMULATION_PRESETS = [
  {
    id: 'genuine_executive',
    title: 'Genuine Executive Call',
    category: 'safe',
    callerName: 'Sunil Sharma (MD & CEO)',
    callerNumber: '+91 98110 44291',
    network: 'Jio 4G VoLTE (AMR-WB 12.65 kbps)',
    location: 'Mumbai HQ, India',
    baseRisk: 14,
    acousticAnomaly: 12,
    vocoderDetected: false,
    vocoderSignature: 'None (Natural Glottal Source)',
    jitterPPQ: 0.74,
    shimmerAPQ: 2.15,
    bioFit: 94,
    keywords: ['quarterly audit report', 'board meeting agenda'],
    contextMultiplier: 1.0,
    transcriptSnippet: "Hello Vikram, I'm calling to verify the quarterly board meeting agenda before our 4 PM session.",
    recommendedAction: 'PASS_THROUGH'
  },
  {
    id: 'elevenlabs_cxo',
    title: 'ElevenLabs AI Clone (CEO Wire Fraud)',
    category: 'critical',
    callerName: 'Sunil Sharma (MD & CEO) [SPOOFED]',
    callerNumber: '+91 98110 44291',
    network: 'VoIP Trunk via Web Gateway (G.711u)',
    location: 'Origin: Anonymous VPN IP 185.220.101.4',
    baseRisk: 91,
    acousticAnomaly: 93,
    vocoderDetected: true,
    vocoderSignature: 'HiFi-GAN v1 / Diffusion Synthesizer',
    jitterPPQ: 0.08,
    shimmerAPQ: 0.42,
    bioFit: 12,
    keywords: ['urgent wire transfer', 'bypass verification', 'approve 4.8 crore RTGS immediately'],
    contextMultiplier: 1.35,
    transcriptSnippet: "Listen Vikram, this is Sunil. I am in a confidential meeting. Approve the 4.8 crore RTGS wire immediately, bypass normal OTP.",
    recommendedAction: 'FREEZE_TRANSACTION_AND_ESCALATE'
  },
  {
    id: 'indic_hindi_clone',
    title: 'Indic-Accented Hindi Clone (XTTS-v2)',
    category: 'critical',
    callerName: 'Rajesh Verma (Regional Director)',
    callerNumber: '+91 94150 88203',
    network: 'WhatsApp Enterprise VoIP (Opus 16 kbps)',
    location: 'Origin: Cloud Hosted Bot Service',
    baseRisk: 79,
    acousticAnomaly: 82,
    vocoderDetected: true,
    vocoderSignature: 'BigVGAN Indic-Trained Vocoder',
    jitterPPQ: 0.12,
    shimmerAPQ: 0.51,
    bioFit: 19,
    keywords: ['turant transfer kijiye', 'OTP approve karein', 'confidential transfer'],
    contextMultiplier: 1.25,
    transcriptSnippet: "Vikram ji, main Rajesh bol raha hoon. Emergency funds hain, kripya bina delay ke transfer release kijiye.",
    recommendedAction: 'CHALLENGE_WITH_STEP_UP_MFA'
  },
  {
    id: 'gsm_noisy_call',
    title: 'Noisy 2G GSM Call (Human Genuine)',
    category: 'safe',
    callerName: 'Pooja Hegde (Branch Operations)',
    callerNumber: '+91 80234 11928',
    network: 'Airtel 2G GSM-FR (13.0 kbps Narrowband)',
    location: 'Hubli Branch, Karnataka',
    baseRisk: 24,
    acousticAnomaly: 28,
    vocoderDetected: false,
    vocoderSignature: 'None (Band-Limited 2G Compression)',
    jitterPPQ: 0.88,
    shimmerAPQ: 2.85,
    bioFit: 88,
    keywords: ['branch cash audit', 'safe verification'],
    contextMultiplier: 1.0,
    transcriptSnippet: "Sir, network thoda kharab hai, but I'm calling from Hubli branch to confirm today's physical cash audit numbers.",
    recommendedAction: 'PASS_THROUGH'
  }
];

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
  
  // Audio diagnostics
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

  // Call timer effect
  useEffect(() => {
    if (isStreaming) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isStreaming]);

  // Telemetry jitter simulation for realism
  useEffect(() => {
    if (isStreaming) {
      telemetryIntervalRef.current = setInterval(() => {
        setCurrentRiskScore(() => {
          let target = activeCall.baseRisk;
          if (streamMode === 'mic') {
            // Live microphone: fluctuates realistically around low risk unless loud noise
            target = 18;
          }
          // Add micro fluctuation +/- 2.5%
          const noise = (Math.random() - 0.5) * 4.5;
          const nextVal = Math.min(99, Math.max(5, Math.round(target + noise)));

          setRiskHistory(hist => {
            const nextHist = [...hist, { time: `${hist.length}s`, score: nextVal }];
            return nextHist.slice(-20); // keep last 20 seconds
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

  const triggerFreeze = useCallback(() => {
    setIsFrozen(true);
  }, []);

  const triggerMfa = useCallback(() => {
    setIsMfaSent(true);
    setShowMfaModal(true);
  }, []);

  const updateActiveCall = useCallback((updates) => {
    setActiveCall(prev => ({ ...prev, ...updates }));
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
