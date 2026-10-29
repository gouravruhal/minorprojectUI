import { useState, useRef, useEffect, useCallback } from 'react';
import { SIMULATION_PRESETS } from '../../../core/state/useCallSession';
import { audioEngine } from '../../../core/audio/audio_engine';
import { playConnectTone, resolveSubscriberIdentity, generateSampleFileResult, processUploadedAudioFile } from './voiceAnalysisHelpers';
import { createScenarioDetectionLogs } from './scenarioLogsHelper';
import { useLiveCallRecorder } from './useLiveCallRecorder';

export function useVoiceAnalysisState({
  activeCall, isStreaming: _isStreaming, onStopStream, onUpdateActiveCall, onResetCallSession
}) {
  const [ingestMode, setIngestMode] = useState('preset');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [customFileResult, setCustomFileResult] = useState(null);
  const fileInputRef = useRef(null);
  const recorder = useLiveCallRecorder();

  const [selectedCountryCode, setSelectedCountryCode] = useState('+91');
  const [phoneNumberDigits, setPhoneNumberDigits] = useState('98110 44291');
  const [enteredNumber, setEnteredNumber] = useState(activeCall?.callerNumber || '+91 98110 44291');
  const [enteredName, setEnteredName] = useState(activeCall?.callerName || 'Sunil Sharma (MD & CEO)');

  const [wirelessStatus, setWirelessStatus] = useState('idle');
  const [handshakeStep, setHandshakeStep] = useState(1);
  const [permissionDeniedMessage, setPermissionDeniedMessage] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState('');

  const [callAnalysisLogs, setCallAnalysisLogs] = useState([]);
  const [logFilter, setLogFilter] = useState('all');
  const [copiedLogs, setCopiedLogs] = useState(false);
  const logsContainerRef = useRef(null);

  const [realtimeFrame, setRealtimeFrame] = useState(1);
  const [realtimeDelta, setRealtimeDelta] = useState(0);
  const [realtimePhonemeSegment, setRealtimePhonemeSegment] = useState('Voiced Harmonic Segment (F0: 132 Hz)');

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

  const handleStartLiveCall = useCallback(async () => {
    setPermissionDeniedMessage(null);
    setWirelessStatus('processing');
    setHandshakeStep(1);
    setTimeout(() => setHandshakeStep(2), 400);
    setTimeout(() => setHandshakeStep(3), 800);
    setTimeout(async () => {
      const res = await recorder.startCall(enteredNumber);
      if (res.success) {
        playConnectTone();
        setSessionStartTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setWirelessStatus('connected');
      } else {
        setWirelessStatus('idle');
        setPermissionDeniedMessage(res.error || 'Microphone/Audio Gateway access was not granted.');
      }
    }, 1200);
  }, [recorder, enteredNumber]);

  const handleStopAndSaveCall = useCallback(async () => {
    const rec = await recorder.stopCall(enteredNumber);
    setWirelessStatus('idle');
    onStopStream?.();
    audioEngine.stopAll();
    return rec;
  }, [recorder, enteredNumber, onStopStream]);

  const handleAnalyzeSavedRecording = useCallback((recording) => {
    const rec = recording || recorder.savedRecording;
    if (!rec?.blob) return;
    const file = new File([rec.blob], rec.filename, { type: rec.blob.type || 'audio/webm' });
    setUploadedFile(file);
    setCustomFileResult(processUploadedAudioFile(file));
    setIngestMode('upload');
  }, [recorder.savedRecording]);

  const handleDisconnectDevice = useCallback(() => {
    recorder.stopCall();
    onStopStream?.(); onResetCallSession?.(); audioEngine.stopAll();
    setWirelessStatus('idle'); setCallAnalysisLogs([]); setRealtimeFrame(1);
  }, [recorder, onStopStream, onResetCallSession]);

  return {
    ingestMode, setIngestMode, uploadedFile, setUploadedFile, customFileResult, setCustomFileResult, fileInputRef,
    selectedCountryCode, phoneNumberDigits, enteredNumber, enteredName, wirelessStatus, setWirelessStatus,
    handshakeStep, permissionDeniedMessage, setPermissionDeniedMessage, sessionStartTime, recorder,
    callAnalysisLogs, setCallAnalysisLogs, logFilter, setLogFilter, copiedLogs, setCopiedLogs, logsContainerRef,
    realtimeFrame, setRealtimeFrame, realtimeDelta, setRealtimeDelta, realtimePhonemeSegment, setRealtimePhonemeSegment,
    handleCountryCodeChange, handlePhoneNumberDigitsChange, handleStartLiveCall, handleStopAndSaveCall,
    handleAnalyzeSavedRecording, handleDisconnectDevice,
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
