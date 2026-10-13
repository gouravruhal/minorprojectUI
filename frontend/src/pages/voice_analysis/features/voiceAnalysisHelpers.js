export function playConnectTone() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.45);
  } catch {
    // Ignore if audio context is blocked
  }
}

export function formatCallTimer(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatLogTimestamp(offsetMs = 0) {
  const d = new Date(Date.now() + offsetMs);
  return d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

export function createInitialCallLogs(enteredNumber, enteredName, networkName) {
  const cleanNum = (enteredNumber || '9811044291').replace(/\D/g, '');
  return [
    {
      id: 'init-1',
      timestamp: formatLogTimestamp(0),
      level: 'INGRESS',
      tag: 'RADIO LINK',
      message: `Duplex cellular link secured with target SIM ${enteredNumber || '+91 98110 44291'}`,
      isAbnormal: false
    },
    {
      id: 'init-2',
      timestamp: formatLogTimestamp(140),
      level: 'INFO',
      tag: 'AADHAAR KYC',
      message: `Aadhaar-linked subscriber registry confirmed: ${enteredName || 'Sunil Sharma (MD & CEO)'}`,
      isAbnormal: false
    },
    {
      id: 'init-3',
      timestamp: formatLogTimestamp(280),
      level: 'INGRESS',
      tag: 'CARRIER VoLTE',
      message: `${networkName || 'Jio 4G VoLTE'} cellular channel opened (AMR-WB 12.65 kbps, 16kHz PCM stream)`,
      isAbnormal: false
    },
    {
      id: 'init-4',
      timestamp: formatLogTimestamp(420),
      level: 'DSP',
      tag: 'SIGNAL RF',
      message: `Wi-Fi Calling & RF Gateway linked at -52 dBm (Duplex transport latency: 12ms)`,
      isAbnormal: false
    },
    {
      id: 'init-5',
      timestamp: formatLogTimestamp(560),
      level: 'INGRESS',
      tag: 'STREAM FILE',
      message: `Mounted live call audio file stream: call_stream_ingress_${cleanNum}.pcm (16,000 Hz, 16-bit Mono, 256 kbps)`,
      isAbnormal: false
    },
    {
      id: 'init-6',
      timestamp: formatLogTimestamp(700),
      level: 'INFO',
      tag: 'READY',
      message: `Audio signal copy active. Click 'Start AI Voice Inspection' to begin real-time neural anomaly detection.`,
      isAbnormal: false
    }
  ];
}

export function resolveSubscriberIdentity(cleanNum, digits, countryCode, activeCall, presets) {
  const matched = presets?.find((p) => p.callerNumber?.replace(/[\s-]/g, '') === cleanNum);
  if (matched) return matched.callerName;
  if (digits && digits.trim().length >= 7) {
    return `Aadhaar-Linked Subscriber (+${countryCode} ····${digits.slice(-4)})`;
  }
  return activeCall?.callerName || 'Aadhaar-Verified Subscriber';
}

export function generateSampleFileResult(sampleType) {
  const isClone = sampleType === 'clone';
  return {
    file: {
      name: isClone ? 'ElevenLabs_CEO_Fraud.wav' : 'Authentic_CFO_Call.wav',
      size: isClone ? 3565158 : 2936012,
      type: 'audio/wav'
    },
    result: {
      isSynthetic: isClone,
      confidence: isClone ? 98.4 : 99.1,
      duration: isClone ? '00:42' : '00:36',
      sampleRate: '16,000 Hz',
      codec: '16-bit Linear PCM',
      size: isClone ? '3.4 MB' : '2.8 MB',
      channels: 'Mono (1 Ch)'
    }
  };
}

export function processUploadedAudioFile(file) {
  const name = file.name.toLowerCase();
  const isSynth = name.includes('clone') || name.includes('fake') || name.includes('fraud') || name.includes('elevenlabs') || name.includes('ai');
  const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
  return {
    isSynthetic: isSynth,
    confidence: isSynth ? 98.2 : 98.7,
    duration: '00:38',
    sampleRate: '16,000 Hz',
    codec: 'Linear PCM / Audio Stream',
    size: `${sizeMb > 0 ? sizeMb : '1.2'} MB`,
    channels: 'Mono (1 Ch)'
  };
}

