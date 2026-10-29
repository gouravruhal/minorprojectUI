/**
 * API client for VoiceShield AI real-time voice analysis and backend communication.
 */

const API_BASE = '/api';

export async function createSession(mode = 'telecom', audioSource = 'laptop_microphone', userConsent = false, phoneNumber = null) {
  try {
    const res = await fetch(`${API_BASE}/voice-analysis/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        audio_source: audioSource,
        user_consent: userConsent,
        phone_number: phoneNumber
      })
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return { session_id: 'local-' + Date.now(), mode, audio_source: audioSource, user_consent: userConsent, error: err.message };
  }
}

export async function getSession(sessionId) {
  try {
    const res = await fetch(`${API_BASE}/voice-analysis/sessions/${sessionId}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return { error: err.message };
  }
}

export async function getTelecomStatus() {
  try {
    const res = await fetch(`${API_BASE}/voice-analysis/telecom/status`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      configured: false,
      provider: 'Twilio Programmable Voice',
      error: err.message,
      instructions: 'Backend service offline or unreachable. Please run `npm run backend` to launch the FastAPI server.'
    };
  }
}

export async function connectTelecom(sessionId, phoneNumber, consentGranted) {
  try {
    const res = await fetch(`${API_BASE}/voice-analysis/telecom/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        phone_number: phoneNumber,
        consent_granted: consentGranted
      })
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      error: 'BACKEND_UNREACHABLE',
      message: 'Failed to connect to telephony backend: ' + err.message
    };
  }
}

export async function disconnectTelecom(sessionId) {
  try {
    const res = await fetch(`${API_BASE}/voice-analysis/telecom/disconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function uploadRecording(file, consent = true) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('consent', consent ? 'true' : 'false');

  const res = await fetch(`${API_BASE}/voice-analysis/recordings`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(errData.detail || `Upload failed with status ${res.status}`);
  }

  return await res.json();
}

export function openVoiceAnalysisWebSocket(sessionId, onMessage, onError, onClose) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = window.location.host;
  const wsUrl = `${protocol}//${wsHost}/ws/voice-analysis/${sessionId}`;

  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    // WebSocket connected
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage?.(data);
    } catch {
      // Non-JSON or binary
    }
  };

  ws.onerror = (err) => {
    onError?.(err);
  };

  ws.onclose = () => {
    onClose?.();
  };

  return ws;
}
