/**
 * Context Analysis Store.
 * Manages client-side persistence of authentic voice analysis reports
 * and microphone sessions directly evaluated by the AI engine.
 */
import { generateContextForRecording } from '../api/voiceAnalysisApi';

const STORAGE_KEY = 'voiceshield_context_recordings';
const SELECTED_KEY = 'voiceshield_selected_recording_id';

export function getSavedRecordings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getSelectedRecordingId() {
  try {
    return localStorage.getItem(SELECTED_KEY) || null;
  } catch {
    return null;
  }
}

export function setSelectedRecordingId(id) {
  try {
    localStorage.setItem(SELECTED_KEY, id);
  } catch {}
}

export function saveVoiceAnalysisRecord(res) {
  if (!res) return null;
  const recordings = getSavedRecordings();
  const id = res.analysisId || `rec-${Date.now()}`;
  const filename = res.name || res.filename || 'uploaded_recording.wav';
  const risk = Number(res.final_risk_score ?? res.riskScore ?? 25);
  const isSynthetic = Boolean(risk >= 50 || res.isSynthetic);
  const threatTier = res.final_threat_tier || (risk >= 70 ? 'CRITICAL' : risk >= 50 ? 'ELEVATED' : 'LOW');
  const action = res.action_recommendation || (isSynthetic ? 'TRIGGER_MFA_CHALLENGE' : 'CONTINUE_MONITORING');

  const record = {
    id,
    contextId: `CTX-${id.toUpperCase()}`,
    filename,
    title: filename.replace(/\.[^/.]+$/, ''),
    callerName: isSynthetic ? 'Caller (Spoof Suspect)' : 'Caller (Verified Phonation)',
    network: isSynthetic ? 'High-Risk Network / VoIP' : 'Direct Microphone / Cellular',
    duration: res.duration || '4.0s',
    acousticRiskScore: risk,
    threatTier,
    isSynthetic,
    voiceSwapDetected: Boolean(res.speaker_verification?.voice_swap_detected),
    actionRecommendation: action,
    llmModel: 'ForensicLLMReasoner-v2-NLU',
    llmReasoningSummary: res.llm_risk_explanation?.summary || `Acoustic telemetry evaluated at ${risk}% risk (${threatTier}).`,
    source: res.source || 'Voice Analysis Ingress',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  const filtered = recordings.filter((r) => r.id !== id && r.filename !== filename);
  const updated = [record, ...filtered];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 30)));
    setSelectedRecordingId(id);
  } catch {}

  // Sync with backend SQLite context table asynchronously
  generateContextForRecording({
    analysis_id: res.analysisId,
    filename,
    acoustic_risk: risk,
    voice_swap_detected: record.voiceSwapDetected,
    duration_seconds: parseFloat(res.duration) || 4.0
  });

  return record;
}
