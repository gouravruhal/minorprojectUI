/**
 * API client for VoiceShield AI real-time voice analysis, telecom bridge, and security response.
 */
const API_BASE = '/api';

export async function createSession(mode = 'microphone', audioSource = 'laptop_microphone', userConsent = true, phoneNumber = null) {
  try {
    const res = await fetch(`${API_BASE}/voice/live/sessions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, audio_source: audioSource, user_consent: userConsent, phone_number: phoneNumber })
    });
    return await res.json();
  } catch (err) {
    return { session_id: 'local-' + Date.now(), mode, error: err.message };
  }
}

export async function stopSession(sessionId) {
  try {
    const res = await fetch(`${API_BASE}/voice/live/${sessionId}/stop`, { method: 'POST' });
    return await res.json();
  } catch (err) { return { error: err.message }; }
}

export async function connectTelecom(sessionId, phoneNumber, consentGranted) {
  try {
    const res = await fetch(`${API_BASE}/voice-analysis/telecom/connect`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, phone_number: phoneNumber, consent_granted: consentGranted })
    });
    return await res.json();
  } catch (err) { return { success: false, error: err.message }; }
}

export async function disconnectTelecom() {
  try {
    const res = await fetch(`${API_BASE}/voice-analysis/telecom/disconnect`, { method: 'POST' });
    return await res.json();
  } catch (err) { return { success: false, error: err.message }; }
}

export async function getTelecomStatus() {
  try {
    const res = await fetch(`${API_BASE}/voice-analysis/telecom/status`);
    return await res.json();
  } catch { return { configured: false, provider: 'Telephony Gateway', instructions: 'Offline' }; }
}

export async function getTelecomDiagnostics() {
  try {
    const res = await fetch(`${API_BASE}/voice-analysis/telecom/diagnostics`);
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

export async function dispatchMfaChallenge(sessionId, callerId, reason) {
  try {
    const res = await fetch(`${API_BASE}/v1/security/challenge-mfa`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, caller_id: callerId, reason })
    });
    return await res.json();
  } catch (err) { return { status: 'ERROR', error: err.message }; }
}

export async function verifyMfaChallenge(challengeId, code = '123456') {
  try {
    const res = await fetch(`${API_BASE}/v1/security/verify-mfa`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: challengeId, code })
    });
    return await res.json();
  } catch (err) { return { status: 'ERROR', error: err.message }; }
}

export async function uploadRecording(file, consent = true, sessionId = null) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('consent', consent ? 'true' : 'false');
  if (sessionId) formData.append('session_id', sessionId);
  const res = await fetch(`${API_BASE}/voice/upload`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return await res.json();
}

export async function analyzeAudioEnterprise(file, context = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('transaction_sensitivity', context.transactionSensitivity || 'high');
  formData.append('caller_trust_level', context.callerTrustLevel || 'standard');
  formData.append('unusual_location_or_voip_flag', context.unusualLocationOrVoipFlag ? 'true' : 'false');
  formData.append('route_type', context.route_type || context.routeType || 'cellular');
  formData.append('transaction_amount', String(context.transaction_amount || context.transactionAmount || 0));
  formData.append('known_contact', String(context.known_contact !== false && context.knownContact !== false));
  formData.append('claimed_identity', context.claimed_identity || context.claimedIdentity || '');
  formData.append('model_mode', context.modelMode || context.model_mode || 'both');
  if (context.callerId || context.caller_id) formData.append('caller_id', context.callerId || context.caller_id);

  const res = await fetch(`${API_BASE}/v1/analyze-audio`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error(`Enterprise analysis failed: ${res.status}`);
  return await res.json();
}

export async function getAnalysisResult(analysisId) {
  const res = await fetch(`${API_BASE}/voice/analysis/${analysisId}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function getRecentAnalyses(limit = 15) {
  try {
    const res = await fetch(`${API_BASE}/voice/analyses/recent?limit=${limit}`);
    return res.ok ? await res.json() : [];
  } catch { return []; }
}

export async function clearDatabase() {
  try {
    const res = await fetch(`${API_BASE}/database/clear`, { method: 'POST' });
    return await res.json();
  } catch (err) { return { status: 'error', error: err.message }; }
}

export async function generateContextForRecording(payload) {
  try {
    const res = await fetch(`${API_BASE}/context-analysis/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok ? await res.json() : null;
  } catch { return null; }
}
