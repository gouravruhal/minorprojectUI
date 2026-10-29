import { useState, useRef, useCallback } from 'react';
import { createSession, openVoiceAnalysisWebSocket } from '../../../core/api/voiceAnalysisApi';

export function useBackendStream() {
  const [connectionState, setConnectionState] = useState('disconnected');
  const [liveResult, setLiveResult] = useState(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [streamError, setStreamError] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);

  const startStream = useCallback(async (mode, audioSource, userConsent, mediaStream) => {
    if (!userConsent) {
      setConnectionState('awaiting_consent');
      return { success: false, error: 'CONSENT_REQUIRED' };
    }

    setConnectionState('connecting');
    setStreamError(null);

    const session = await createSession(mode, audioSource, userConsent);
    setSessionId(session.session_id);

    try {
      const ws = openVoiceAnalysisWebSocket(
        session.session_id,
        (data) => {
          setConnectionState('analyzing');
          setLiveResult({
            ...data,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          });
          if (data.transcript) {
            setLiveTranscript(data.transcript);
          }
        },
        (err) => {
          setStreamError(err?.message || 'WebSocket connection error');
          setConnectionState('error');
        },
        () => {
          setConnectionState((prev) => (prev === 'analyzing' || prev === 'streaming_audio' ? 'stopped' : prev));
        }
      );
      wsRef.current = ws;

      if (mediaStream) {
        setConnectionState('streaming_audio');
        // Stream audio chunks via MediaRecorder
        const recorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm;codecs=opus' });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = async (e) => {
          if (e.data && e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            const buf = await e.data.arrayBuffer();
            ws.send(buf);
          }
        };
        recorder.start(600); // 600ms slices
      } else {
        setConnectionState('connected');
      }

      return { success: true, sessionId: session.session_id };
    } catch (err) {
      setStreamError(err.message);
      setConnectionState('error');
      return { success: false, error: err.message };
    }
  }, []);

  const stopStream = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch { /* ignore */ }
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch { /* ignore */ }
    }
    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ action: 'stop' }));
        }
        wsRef.current.close();
      } catch { /* ignore */ }
    }
    setConnectionState('stopped');
  }, []);

  return {
    connectionState,
    setConnectionState,
    liveResult,
    setLiveResult,
    liveTranscript,
    streamError,
    setStreamError,
    sessionId,
    startStream,
    stopStream
  };
}
