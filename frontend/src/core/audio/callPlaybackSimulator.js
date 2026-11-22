/**
 * VoiceShield AI - Simulated Live Call Audio Playback Engine
 * Decodes pre-recorded call samples, plays audio in real-time,
 * and streams 2.0s sliding window chunks over WebSocket.
 */

function encodeWav(samples, sampleRate = 16000) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (o, str) => { for (let i = 0; i < str.length; i++) view.setUint8(o + i, str.charCodeAt(i)); };

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
  return buffer;
}

export class CallPlaybackSimulator {
  constructor({ onAudioLevel, onProgress, onComplete, wsClient }) {
    this.onAudioLevel = onAudioLevel;
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.wsClient = wsClient;
    this.audioCtx = null;
    this.sourceNode = null;
    this.gainNode = null;
    this.isPlaying = false;
    this.timerId = null;
  }

  async startSimulation(audioArrayBuffer, isMuted = false) {
    this.stopSimulation();
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContextClass();
    const decoded = await this.audioCtx.decodeAudioData(audioArrayBuffer);
    const channelData = decoded.getChannelData(0);
    const sr = decoded.sampleRate;
    const duration = decoded.duration;

    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.value = isMuted ? 0 : 0.8;
    this.gainNode.connect(this.audioCtx.destination);

    this.sourceNode = this.audioCtx.createBufferSource();
    this.sourceNode.buffer = decoded;
    this.sourceNode.connect(this.gainNode);

    const chunkSec = 2.0;
    const chunkSamples = Math.round(sr * chunkSec);
    let sampleOffset = 0;
    let chunkIndex = 0;
    this.isPlaying = true;

    this.sourceNode.start(0);

    const tickIntervalMs = 1500;
    this.timerId = setInterval(() => {
      if (!this.isPlaying || sampleOffset >= channelData.length) {
        this.stopSimulation();
        this.onComplete?.();
        return;
      }

      const endOffset = Math.min(sampleOffset + chunkSamples, channelData.length);
      const rawSlice = channelData.slice(sampleOffset, endOffset);

      let sum = 0;
      for (let i = 0; i < rawSlice.length; i++) sum += rawSlice[i] * rawSlice[i];
      const rms = Math.sqrt(sum / (rawSlice.length || 1));
      this.onAudioLevel?.(Math.min(100, Math.round(rms * 280)));

      // Resample to 16kHz for uniform neural inference
      const target16kSamples = Math.round(rawSlice.length * (16000 / sr));
      const resampled16k = new Float32Array(target16kSamples);
      for (let i = 0; i < target16kSamples; i++) {
        const srcIdx = Math.floor(i * (sr / 16000));
        resampled16k[i] = rawSlice[srcIdx] || 0;
      }

      const wavBuffer = encodeWav(resampled16k, 16000);
      this.wsClient?.sendAudioChunk(wavBuffer);

      chunkIndex += 1;
      const currentSec = Math.min(duration, Math.round((sampleOffset / sr) * 10) / 10);
      this.onProgress?.(currentSec, Math.round(duration * 10) / 10);
      sampleOffset += Math.round(sr * 1.5); // 1.5s sliding hop
    }, tickIntervalMs);

    return { durationSec: Math.round(duration * 10) / 10 };
  }

  setMuted(muted) {
    if (this.gainNode) {
      this.gainNode.gain.value = muted ? 0 : 0.8;
    }
  }

  stopSimulation() {
    this.isPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.sourceNode) {
      try { this.sourceNode.stop(); this.sourceNode.disconnect(); } catch {}
      this.sourceNode = null;
    }
    if (this.audioCtx) {
      try { this.audioCtx.close(); } catch {}
      this.audioCtx = null;
    }
  }
}

export default CallPlaybackSimulator;
