/**
 * VoiceShield AI - Real-time Laptop Microphone 2-Second Chunk & Full Session Recorder
 * Captures live microphone audio, evaluates 2.0s rolling slices via neural backend,
 * passes context metadata, and compiles the full session audio upon stop.
 */

let activeStream = null;
let audioContext = null;
let scriptNode = null;
let pcmBuffer = [];
let allSessionSamples = [];
let chunkCounter = 0;
let isRecording = false;

function encodeWavBlob(samples, sampleRate = 16000) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export async function startMicStream(onChunkEvaluated, onAudioLevel, getContextPayload) {
  stopMicStream();
  pcmBuffer = [];
  allSessionSamples = [];
  chunkCounter = 0;
  isRecording = true;

  try {
    activeStream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    });

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
    const sampleRate = audioContext.sampleRate || 48000;
    const source = audioContext.createMediaStreamSource(activeStream);

    scriptNode = audioContext.createScriptProcessor(4096, 1, 1);
    const targetChunkSamples = Math.round(sampleRate * 2.0);

    scriptNode.onaudioprocess = async (e) => {
      if (!isRecording) return;
      const input = e.inputBuffer.getChannelData(0);

      let sum = 0;
      for (let i = 0; i < input.length; i++) {
        sum += input[i] * input[i];
        pcmBuffer.push(input[i]);
        allSessionSamples.push(input[i]);
      }
      const rms = Math.sqrt(sum / input.length);
      onAudioLevel?.(Math.min(100, Math.round(rms * 250)));

      if (pcmBuffer.length >= targetChunkSamples) {
        const slice = new Float32Array(pcmBuffer.splice(0, targetChunkSamples));
        chunkCounter += 1;
        const currentCount = chunkCounter;
        const wavBlob = encodeWavBlob(slice, sampleRate);
        const ctx = getContextPayload ? getContextPayload() : {};

        try {
          const formData = new FormData();
          formData.append('file', wavBlob, `mic_stream_t${currentCount * 2}s.wav`);
          formData.append('caller_id', ctx.callerId || 'LAPTOP_MIC_LIVE');
          formData.append('route_type', ctx.routeType || 'cellular');
          formData.append('transaction_amount', String(ctx.transactionAmount || 0));
          formData.append('known_contact', String(ctx.knownContact !== false));
          formData.append('claimed_identity', ctx.claimedIdentity || '');

          const res = await fetch('/api/v1/analyze-audio', { method: 'POST', body: formData });
          if (res.ok) {
            const data = await res.json();
            onChunkEvaluated?.({
              chunkId: currentCount,
              timestampSec: currentCount * 2.0,
              timeLabel: new Date().toLocaleTimeString(),
              riskScore: Number(data.final_risk_score ?? data.risk_score ?? 10.0),
              threatTier: data.final_threat_tier ?? data.threat_tier ?? 'SAFE',
              isSynthetic: Boolean(data.is_synthetic || (data.final_risk_score >= 50)),
              attributions: data.attributions || {},
              riskBreakdown: data.risk_breakdown || null,
              dspFeatures: data.multi_layer_analysis || data.dsp_features || null,
              speakerVerification: data.speaker_verification || null,
              speechTextAnalysis: data.speech_text_analysis || null,
              speakerDrift: data.speaker_verification?.max_drift ?? 0.04,
              latencyMs: data.latency_ms ?? 35,
              action: data.action_recommendation ?? data.action ?? 'CONTINUE_MONITORING'
            });
          }
        } catch (err) {
          console.warn('[MicChunkRecorder] Backend inference error:', err);
        }
      }
    };

    source.connect(scriptNode);
    scriptNode.connect(audioContext.destination);
    return { success: true };
  } catch (err) {
    stopMicStream();
    return { success: false, error: err.message };
  }
}

export function stopMicStream() {
  isRecording = false;
  const currentSr = (audioContext && audioContext.sampleRate) ? audioContext.sampleRate : 48000;
  if (scriptNode) {
    try { scriptNode.disconnect(); } catch {}
    scriptNode = null;
  }
  if (audioContext) {
    try { audioContext.close(); } catch {}
    audioContext = null;
  }
  if (activeStream) {
    activeStream.getTracks().forEach((t) => t.stop());
    activeStream = null;
  }
  pcmBuffer = [];

  const totalLen = allSessionSamples.length;
  if (totalLen > 0) {
    const fullFloatArray = new Float32Array(allSessionSamples);
    allSessionSamples = [];
    const fullBlob = encodeWavBlob(fullFloatArray, currentSr);
    const durationSec = Math.round((totalLen / currentSr) * 10) / 10;
    return { fullBlob, durationSec, chunkCount: chunkCounter };
  }
  allSessionSamples = [];
  return null;
}
