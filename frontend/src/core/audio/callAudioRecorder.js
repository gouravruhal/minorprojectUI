/**
 * VoiceShield AI - Call Audio Recorder
 * Real-time media stream capture and recording for live phone calls.
 */

let activeStream = null;
let activeRecorder = null;
let recordedChunks = [];
let animFrameId = null;
let audioCtx = null;
let analyser = null;

export async function getAudioInputDevices() {
  try {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    // Prompt permission if needed so labels are populated
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((d) => d.kind === 'audioinput')
      .map((d, i) => ({
        deviceId: d.deviceId,
        label: d.label || `Audio Input ${i + 1} (Microphone / Bluetooth)`
      }));
  } catch {
    return [];
  }
}

export async function startCallRecording(deviceId, onVolume) {
  try {
    stopCallRecording();
    recordedChunks = [];

    const constraints = {
      audio: deviceId ? { deviceId: { exact: deviceId } } : {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    };

    activeStream = await navigator.mediaDevices.getUserMedia(constraints);

    // Audio level meter
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(activeStream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const avg = Math.min(100, Math.round((sum / dataArray.length / 128) * 100));
        onVolume?.(avg);
        animFrameId = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch {
      // AudioContext fallback
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : 'audio/mp4';

    activeRecorder = new MediaRecorder(activeStream, { mimeType });
    activeRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };
    activeRecorder.start(500); // 500ms slices

    return { success: true, stream: activeStream, mimeType };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function stopCallRecording() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  if (audioCtx) {
    try { audioCtx.close(); } catch {}
    audioCtx = null;
    analyser = null;
  }
  if (activeStream) {
    activeStream.getTracks().forEach((track) => track.stop());
    activeStream = null;
  }

  return new Promise((resolve) => {
    if (!activeRecorder) {
      resolve(null);
      return;
    }

    const rec = activeRecorder;
    activeRecorder = null;

    if (rec.state !== 'inactive') {
      rec.onstop = () => {
        const mime = rec.mimeType || 'audio/webm';
        const blob = new Blob(recordedChunks, { type: mime });
        const audioUrl = URL.createObjectURL(blob);
        recordedChunks = [];
        resolve({ blob, audioUrl, mimeType: mime, size: (blob.size / 1024).toFixed(1) + ' KB' });
      };
      rec.stop();
    } else {
      resolve(null);
    }
  });
}

export function downloadRecording(blob, filename = 'live_call_recording.webm') {
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
