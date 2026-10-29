import { useState, useEffect, useRef, useCallback } from 'react';
import { getAudioInputDevices, startCallRecording, stopCallRecording } from '../../../core/audio/callAudioRecorder';

export function useLiveCallRecorder() {
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [audioVolume, setAudioVolume] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [savedRecording, setSavedRecording] = useState(null);
  const [callSeconds, setCallSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    getAudioInputDevices().then((devices) => {
      setAudioDevices(devices);
      if (devices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(devices[0].deviceId);
      }
    });
  }, [selectedDeviceId]);

  const startCall = useCallback(async () => {
    setSavedRecording(null);
    setCallSeconds(0);
    const res = await startCallRecording(selectedDeviceId, (vol) => {
      setAudioVolume(vol);
    });

    if (res.success) {
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setCallSeconds((s) => s + 1);
      }, 1000);
      return { success: true, stream: res.stream };
    }
    return { success: false, error: res.error };
  }, [selectedDeviceId]);

  const stopCall = useCallback(async (phoneNumber) => {
    clearInterval(timerRef.current);
    setIsRecording(false);
    setAudioVolume(0);

    const result = await stopCallRecording();
    if (result) {
      const mins = String(Math.floor(callSeconds / 60)).padStart(2, '0');
      const secs = String(callSeconds % 60).padStart(2, '0');
      const recordingData = {
        ...result,
        phoneNumber: phoneNumber || 'Live Call',
        durationText: `${mins}:${secs}`,
        durationSeconds: callSeconds,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setSavedRecording(recordingData);
      return recordingData;
    }
    return null;
  }, [callSeconds]);

  const clearRecording = useCallback(() => {
    setSavedRecording(null);
    setCallSeconds(0);
    setAudioVolume(0);
  }, []);

  return {
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    audioVolume,
    isRecording,
    savedRecording,
    callSeconds,
    startCall,
    stopCall,
    clearRecording
  };
}
