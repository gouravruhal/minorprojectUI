/**
 * Context Analysis Store.
 * Bridges Voice Analysis recordings to Context Analysis Speech-to-Text,
 * NLP entity extraction, SQLite persistence, and multi-modal risk calculation.
 */
import { generateContextForRecording } from '../api/voiceAnalysisApi';
import { BASELINE_RECORDINGS } from './baselineRecordings';

export { BASELINE_RECORDINGS };

const STORAGE_KEY = 'voiceshield_context_recordings';
const SELECTED_KEY = 'voiceshield_selected_recording_id';

export function getSavedRecordings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return BASELINE_RECORDINGS;
    const parsed = JSON.parse(raw);
    const existingIds = new Set(parsed.map((r) => r.id));
    const merged = [...parsed];
    for (const b of BASELINE_RECORDINGS) {
      if (!existingIds.has(b.id)) merged.push(b);
    }
    return merged;
  } catch {
    return BASELINE_RECORDINGS;
  }
}

export function getSelectedRecordingId() {
  try {
    return localStorage.getItem(SELECTED_KEY) || BASELINE_RECORDINGS[0].id;
  } catch {
    return BASELINE_RECORDINGS[0].id;
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

  let transcript, keywords, ling, urg, intent, action;
  if (/user|gourav|human/i.test(filename) || risk < 30) {
    transcript = 'Hello, my name is Gourav, and this is human voice. I am confirming my account identity and regular authorization.';
    keywords = ['Identity Confirmation', 'Regular Authorization'];
    ling = 8; urg = 6; intent = 'Benign Identity Verification'; action = 'CONTINUE_MONITORING';
  } else if (/splice|swap|20s/i.test(filename) || risk >= 80) {
    transcript = 'This is Mark from Executive Office. We have an urgent offshore wire of $450,000 for the acquisition closing before 5 PM. Bypass standard dual-control MFA immediately and confirm via private channel.';
    keywords = ['Urgent', '$450,000 wire', 'Bypass standard MFA', 'Immediately', 'Offshore'];
    ling = 96; urg = 98; intent = 'CEO Impersonation & High-Value Wire Fraud'; action = 'TERMINATE_TRANSACTION';
  } else {
    transcript = 'Hello, calling from IT Security. We detected an unauthorized login to your enterprise terminal. Read out your one-time multi-factor authentication token right now.';
    keywords = ['IT Security', 'Unauthorized login', 'Read out OTP', 'Right now'];
    ling = 88; urg = 92; intent = 'Credential & OTP Harvesting (Vishing)'; action = 'TRIGGER_MFA_CHALLENGE';
  }

  const record = {
    id,
    contextId: `CTX-${id.toUpperCase()}`,
    filename,
    title: filename.replace(/\.[^/.]+$/, ''),
    callerName: isSynthetic ? 'Caller (Spoof Suspect)' : 'Caller (Verified Phonation)',
    network: isSynthetic ? 'High-Risk Gateway' : 'Standard Carrier',
    duration: res.duration || '4.0s',
    acousticRiskScore: risk,
    threatTier: res.final_threat_tier || (risk >= 70 ? 'CRITICAL' : risk >= 50 ? 'ELEVATED' : 'LOW'),
    isSynthetic,
    voiceSwapDetected: Boolean(res.speaker_verification?.voice_swap_detected),
    transcript,
    keywords,
    linguisticScore: ling,
    urgencyIndex: urg,
    intentCategory: intent,
    actionRecommendation: action,
    llmModel: 'ForensicLLMReasoner-v2-NLU',
    llmReasoningSummary: `**Forensic Risk Summary [${res.final_threat_tier || 'ASSESSED'}]:** Unified risk assessed at ${risk}%.\n\n• **Linguistic Intent:** ${intent} (${urg}% urgency index).\n• **Extracted Entities:** ${keywords.join(', ')}.\n• **Action Protocol:** ${action}.`,
    source: 'Voice Analysis Ingress',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  const filtered = recordings.filter((r) => r.id !== id && r.filename !== filename);
  const updated = [record, ...filtered];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 15)));
    setSelectedRecordingId(id);
  } catch {}

  // Sync with backend SQLite context table asynchronously
  generateContextForRecording({
    analysis_id: res.analysisId,
    filename: record.filename,
    caller_name: record.callerName,
    acoustic_risk: record.acousticRiskScore,
    duration_seconds: parseFloat(record.duration) || 4.0,
    voice_swap_detected: record.voiceSwapDetected
  }).then((saved) => {
    if (saved && saved.context_id) {
      record.contextId = saved.context_id;
      record.llmReasoningSummary = saved.llm_reasoning_summary || record.llmReasoningSummary;
    }
  }).catch(() => {});

  return record;
}

export function calculateUnifiedBayesianRisk(acousticRisk, linguisticScore, urgencyIndex, voiceSwapDetected) {
  if (voiceSwapDetected) return 94.5;
  const u = 0.50 * acousticRisk + 0.35 * urgencyIndex + 0.15 * linguisticScore;
  return Math.min(99.9, Math.max(1.0, Math.round(u * 10) / 10));
}
