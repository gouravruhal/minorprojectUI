import { useState, useRef, useEffect } from 'react';
import { SIMULATION_PRESETS } from '../../../core/state/useCallSession';
import { audioEngine } from '../../../core/audio/audio_engine';
import { playConnectTone, resolveSubscriberIdentity, generateSampleFileResult, processUploadedAudioFile } from './voiceAnalysisHelpers';
import { createScenarioDetectionLogs } from './scenarioLogsHelper';

export function useVoiceAnalysisState({
  activeCall, isStreaming, onStartStream: _onStartStream, onStopStream, onUpdateActiveCall, onResetCallSession
}) {
  const [ingestMode, setIngestMode] = useState('preset');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [customFileResult, setCustomFileResult] = useState(null);
  const fileInputRef = useRef(null);

  const [selectedCountryCode, setSelectedCountryCode] = useState('+91');
  const [phoneNumberDigits, setPhoneNumberDigits] = useState('98110 44291');
  const [enteredNumber, setEnteredNumber] = useState(activeCall?.callerNumber || '+91 98110 44291');
  const [enteredName, setEnteredName] = useState(activeCall?.callerName || 'Sunil Sharma (MD & CEO)');

  const [wirelessStatus, setWirelessStatus] = useState('idle');
  const [handshakeStep, setHandshakeStep] = useState(1);
  const [permissionDeniedMessage, setPermissionDeniedMessage] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState('');

  const [isDeviceCallActive, setIsDeviceCallActive] = useState(false);
  const [deviceCallDuration, setDeviceCallDuration] = useState(0);
  const [simAudioSource, setSimAudioSource] = useState('carrier');

  const [inspectionPhase, setInspectionPhase] = useState('idle');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [callAnalysisLogs, setCallAnalysisLogs] = useState([]);
  const [logFilter, setLogFilter] = useState('all');
  const [copiedLogs, setCopiedLogs] = useState(false);
  const logsContainerRef = useRef(null);

  const [realtimeFrame, setRealtimeFrame] = useState(1);
  const [realtimeDelta, setRealtimeDelta] = useState(0);
  const [realtimePhonemeSegment, setRealtimePhonemeSegment] = useState('Voiced Harmonic Segment (F0: 132 Hz)');
  const [wifiSignalDbm, setWifiSignalDbm] = useState(-52);
  const [wifiPingMs, setWifiPingMs] = useState(12);

  useEffect(() => {
    onStopStream?.(); onResetCallSession?.(); audioEngine.stopAll();
    return () => { onStopStream?.(); onResetCallSession?.(); audioEngine.stopAll(); };
  }, [onStopStream, onResetCallSession]);

  useEffect(() => {
    if (!activeCall) return;
    const t = setTimeout(() => {
      setEnteredNumber(activeCall.callerNumber || '');
      setEnteredName(activeCall.callerName || '');
      const parts = (activeCall.callerNumber || '').split(' ');
      if (parts.length > 1) {
        setSelectedCountryCode(parts[0]);
        setPhoneNumberDigits(parts.slice(1).join(' '));
      }
      setCallAnalysisLogs(createScenarioDetectionLogs(activeCall));
    }, 0);
    return () => clearTimeout(t);
  }, [activeCall]);

  useEffect(() => {
    let t0, t1, t2;
    if (!isStreaming) {
      t0 = setTimeout(() => { setInspectionPhase('idle'); setAnalysisProgress(0); }, 0);
    } else {
      t0 = setTimeout(() => { setInspectionPhase('analyzing'); setAnalysisProgress(25); }, 0);
      t1 = setTimeout(() => setAnalysisProgress(75), 500);
      t2 = setTimeout(() => { setAnalysisProgress(100); setInspectionPhase('active'); }, 1000);
    }
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  }, [isStreaming]);

  useEffect(() => {
    if (!isDeviceCallActive || wirelessStatus !== 'connected') return;
    const interval = setInterval(() => setDeviceCallDuration((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isDeviceCallActive, wirelessStatus]);

  useEffect(() => {
    if (wirelessStatus !== 'connected') return;
    const interval = setInterval(() => {
      const j = Math.floor((Math.random() - 0.5) * 4);
      setWifiSignalDbm(-52 + j);
      setWifiPingMs(Math.max(8, Math.min(20, 12 + j)));
    }, 2500);
    return () => clearInterval(interval);
  }, [wirelessStatus]);

  const handleCountryCodeChange = (e) => {
    const code = e.target.value; setSelectedCountryCode(code);
    const combined = `${code} ${phoneNumberDigits}`.trim();
    setEnteredNumber(combined); setPermissionDeniedMessage(null);
    const name = resolveSubscriberIdentity(combined.replace(/[\s-]/g, ''), phoneNumberDigits, code, activeCall, SIMULATION_PRESETS);
    setEnteredName(name); onUpdateActiveCall?.({ callerNumber: combined, callerName: name });
  };

  const handlePhoneNumberDigitsChange = (e) => {
    const val = e.target.value; setPhoneNumberDigits(val);
    const combined = `${selectedCountryCode} ${val}`.trim();
    setEnteredNumber(combined); setPermissionDeniedMessage(null);
    const name = resolveSubscriberIdentity(combined.replace(/[\s-]/g, ''), val, selectedCountryCode, activeCall, SIMULATION_PRESETS);
    setEnteredName(name); onUpdateActiveCall?.({ callerNumber: combined, callerName: name });
  };

  const handleConnectDeviceClick = () => {
    setPermissionDeniedMessage(null); setWirelessStatus('processing'); setHandshakeStep(1);
    setTimeout(() => setHandshakeStep(2), 650);
    setTimeout(() => setHandshakeStep(3), 1350);
    setTimeout(() => setHandshakeStep(4), 2050);
    setTimeout(() => {
      playConnectTone();
      setSessionStartTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setWirelessStatus('connected'); setIsDeviceCallActive(true); setDeviceCallDuration(0);
    }, 2700);
  };

  const handleDisconnectDevice = () => {
    onStopStream?.(); onResetCallSession?.(); audioEngine.stopAll();
    setWirelessStatus('idle'); setIsDeviceCallActive(false); setDeviceCallDuration(0);
    setInspectionPhase('idle'); setAnalysisProgress(0); setCallAnalysisLogs([]); setRealtimeFrame(1);
  };

  return {
    ingestMode, setIngestMode, uploadedFile, setUploadedFile, customFileResult, setCustomFileResult, fileInputRef,
    selectedCountryCode, phoneNumberDigits, enteredNumber, enteredName, wirelessStatus, setWirelessStatus,
    handshakeStep, permissionDeniedMessage, setPermissionDeniedMessage, sessionStartTime,
    isDeviceCallActive, deviceCallDuration, simAudioSource, setSimAudioSource,
    inspectionPhase, analysisProgress, callAnalysisLogs, setCallAnalysisLogs, logFilter, setLogFilter,
    copiedLogs, setCopiedLogs, logsContainerRef, realtimeFrame, setRealtimeFrame, realtimeDelta, setRealtimeDelta,
    realtimePhonemeSegment, setRealtimePhonemeSegment, wifiSignalDbm, wifiPingMs,
    handleCountryCodeChange, handlePhoneNumberDigitsChange, handleConnectDeviceClick, handleDisconnectDevice,
    handleLoadSampleFile: (type) => {
      const { file, result } = generateSampleFileResult(type);
      setUploadedFile(file); setCustomFileResult(result);
    },
    handleFileUpload: (f) => {
      if (!f) return;
      setUploadedFile(f); setCustomFileResult(processUploadedAudioFile(f));
    },
    handleClearUploadedFile: () => { setUploadedFile(null); setCustomFileResult(null); }
  };
}
