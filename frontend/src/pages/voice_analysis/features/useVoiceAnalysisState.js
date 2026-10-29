import { useState, useRef, useEffect, useCallback } from 'react';
import { SIMULATION_PRESETS } from '../../../core/state/useCallSession';
import { audioEngine } from '../../../core/audio/audio_engine';
import { playConnectTone, resolveSubscriberIdentity } from './voiceAnalysisHelpers';
import { createScenarioDetectionLogs } from './scenarioLogsHelper';
import { useLiveCallRecorder } from './useLiveCallRecorder';
import { useBackendStream } from './useBackendStream';
import { useFileUploadAnalysis } from './useFileUploadAnalysis';
import { connectTelecom } from '../../../core/api/voiceAnalysisApi';

export function useVoiceAnalysisState({
  activeCall, isStreaming: _isStreaming, onStopStream, onUpdateActiveCall, onResetCallSession
}) {
  const [ingestMode, setIngestMode] = useState('preset');
  const fileInputRef = useRef(null);
  const recorder = useLiveCallRecorder();
  const backendStream = useBackendStream();
  const fileAnalysis = useFileUploadAnalysis();

  const [telecomSource, setTelecomSource] = useState('laptop_microphone');
  const [userConsent, setUserConsent] = useState(false);
  const [telecomError, setTelecomError] = useState(null);
  const [telecomTrouble, setTelecomTrouble] = useState(null);

  const [selectedCountryCode, setSelectedCountryCode] = useState('+91');
  const [phoneNumberDigits, setPhoneNumberDigits] = useState('98110 44291');
  const [enteredNumber, setEnteredNumber] = useState(activeCall?.callerNumber || '+91 98110 44291');
  const [enteredName, setEnteredName] = useState(activeCall?.callerName || 'Sunil Sharma (MD & CEO)');
  const [wirelessStatus, setWirelessStatus] = useState('idle');
  const [handshakeStep, setHandshakeStep] = useState(1);
  const [sessionStartTime, setSessionStartTime] = useState('');

  const [callAnalysisLogs, setCallAnalysisLogs] = useState([]);
  const [logFilter, setLogFilter] = useState('all');
  const [copiedLogs, setCopiedLogs] = useState(false);
  const logsContainerRef = useRef(null);

  useEffect(() => {
    onStopStream?.(); onResetCallSession?.(); audioEngine.stopAll();
    return () => { onStopStream?.(); onResetCallSession?.(); audioEngine.stopAll(); };
  }, [onStopStream, onResetCallSession]);

  useEffect(() => {
    if (!activeCall) return;
    const t = setTimeout(() => {
      setEnteredNumber(activeCall.callerNumber || '');
      setEnteredName(activeCall.callerName || '');
      setCallAnalysisLogs(createScenarioDetectionLogs(activeCall));
    }, 0);
    return () => clearTimeout(t);
  }, [activeCall]);

  const handleCountryCodeChange = (e) => {
    const code = e.target.value; setSelectedCountryCode(code);
    const combined = `${code} ${phoneNumberDigits}`.trim();
    setEnteredNumber(combined);
    const name = resolveSubscriberIdentity(combined.replace(/[\s-]/g, ''), phoneNumberDigits, code, activeCall, SIMULATION_PRESETS);
    setEnteredName(name); onUpdateActiveCall?.({ callerNumber: combined, callerName: name });
  };

  const handlePhoneNumberDigitsChange = (e) => {
    const val = e.target.value; setPhoneNumberDigits(val);
    const combined = `${selectedCountryCode} ${val}`.trim();
    setEnteredNumber(combined);
    const name = resolveSubscriberIdentity(combined.replace(/[\s-]/g, ''), val, selectedCountryCode, activeCall, SIMULATION_PRESETS);
    setEnteredName(name); onUpdateActiveCall?.({ callerNumber: combined, callerName: name });
  };

  const handleStartLiveCall = useCallback(async () => {
    if (!userConsent) {
      setTelecomError('Mutual consent confirmation is mandatory before audio capture.');
      return;
    }
    setTelecomError(null); setTelecomTrouble(null); setWirelessStatus('processing'); setHandshakeStep(1);
    setTimeout(() => setHandshakeStep(2), 350);
    setTimeout(() => setHandshakeStep(3), 700);

    setTimeout(async () => {
      if (telecomSource === 'twilio_provider') {
        const res = await connectTelecom(backendStream.sessionId, enteredNumber, userConsent);
        if (res.success) {
          playConnectTone();
          setSessionStartTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          setWirelessStatus('connected');
        } else {
          setWirelessStatus('idle');
          setTelecomError(res.message || 'Telephony provider error.');
          setTelecomTrouble(res.troubleshooting ? Object.values(res.troubleshooting).join(' ') : null);
        }
      } else {
        const recRes = await recorder.startCall(enteredNumber);
        if (recRes.success) {
          await backendStream.startStream('telecom', telecomSource, userConsent, recRes.stream);
          playConnectTone();
          setSessionStartTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          setWirelessStatus('connected');
        } else {
          setWirelessStatus('idle');
          setTelecomError(recRes.error || 'Audio gateway access was denied.');
        }
      }
    }, 1100);
  }, [userConsent, telecomSource, enteredNumber, recorder, backendStream]);

  const handleStopAndSaveCall = useCallback(async () => {
    const rec = await recorder.stopCall(enteredNumber);
    backendStream.stopStream();
    setWirelessStatus('idle');
    onStopStream?.();
    audioEngine.stopAll();
    return rec;
  }, [recorder, enteredNumber, backendStream, onStopStream]);

  const handleAnalyzeSavedRecording = useCallback((recording) => {
    const rec = recording || recorder.savedRecording;
    if (!rec?.blob) return;
    const file = new File([rec.blob], rec.filename, { type: rec.blob.type || 'audio/webm' });
    fileAnalysis.handleFileUpload(file, true);
    setIngestMode('upload');
  }, [recorder.savedRecording, fileAnalysis]);

  const handleDisconnectDevice = useCallback(() => {
    recorder.stopCall(); backendStream.stopStream();
    onStopStream?.(); onResetCallSession?.(); audioEngine.stopAll();
    setWirelessStatus('idle'); setCallAnalysisLogs([]);
  }, [recorder, backendStream, onStopStream, onResetCallSession]);

  return {
    ingestMode, setIngestMode, fileInputRef, recorder, backendStream, fileAnalysis,
    telecomSource, setTelecomSource, userConsent, setUserConsent, telecomError, telecomTrouble,
    selectedCountryCode, phoneNumberDigits, enteredNumber, enteredName, wirelessStatus, setWirelessStatus,
    handshakeStep, sessionStartTime, callAnalysisLogs, setCallAnalysisLogs, logFilter, setLogFilter,
    copiedLogs, setCopiedLogs, logsContainerRef,
    handleCountryCodeChange, handlePhoneNumberDigitsChange, handleStartLiveCall, handleStopAndSaveCall,
    handleAnalyzeSavedRecording, handleDisconnectDevice
  };
}
