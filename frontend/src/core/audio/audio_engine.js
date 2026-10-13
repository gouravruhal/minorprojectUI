/**
 * VoiceShield AI - Core Audio Engine
 * Handles Web Audio API Analyser, Microphone Capture, and Synthetic Telemetry Generator for presets.
 */

class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.sourceNode = null;
    this.mediaStream = null;
    this.isRunning = false;
    this.mode = 'idle'; // 'mic' | 'simulation' | 'idle'
    this.simulationPreset = null;
    this.simOscillator = null;
    this.simNoise = null;
    this.simGain = null;
  }

  async initAudioContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    if (!this.analyser) {
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.8;
    }
  }

  /**
   * Start live microphone input
   */
  async startMicrophone() {
    await this.initAudioContext();
    this.stopSimulation();

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // We want raw acoustic properties
          autoGainControl: false,
          sampleRate: 16000
        }
      });

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.sourceNode.connect(this.analyser);
      this.isRunning = true;
      this.mode = 'mic';
      return { success: true };
    } catch (err) {
      console.error('Failed to access microphone:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Stop microphone input
   */
  stopMicrophone() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.mode === 'mic') {
      this.isRunning = false;
      this.mode = 'idle';
    }
  }

  /**
   * Play and analyze uploaded audio file
   */
  async playAudioFile(file) {
    await this.initAudioContext();
    this.stopAll();

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.analyser);
      source.connect(this.audioContext.destination);
      source.start(0);

      this.sourceNode = source;
      this.isRunning = true;
      this.mode = 'file';

      source.onended = () => {
        this.isRunning = false;
        this.mode = 'idle';
      };

      return { 
        success: true, 
        duration: audioBuffer.duration, 
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels
      };
    } catch (err) {
      console.error('Failed to decode audio file:', err);
      return { success: false, error: err.message };
    }
  }

  stopAudioFile() {
    if (this.sourceNode && this.mode === 'file') {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch {
        // ignore
      }
      this.sourceNode = null;
      this.isRunning = false;
      this.mode = 'idle';
    }
  }

  /**
   * Start built-in simulation preset with dynamic audio synthesis
   */
  async startSimulation(preset) {
    await this.initAudioContext();
    this.stopMicrophone();
    this.stopSimulation();

    this.simulationPreset = preset;
    this.mode = 'simulation';
    this.isRunning = true;

    // Create synthetic oscillator and harmonics to feed analyser
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    if (preset.id === 'elevenlabs_cxo') {
      // Cloned speech: slightly rigid frequency with vocoder jitter
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(145, this.audioContext.currentTime);
      gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    } else if (preset.id === 'indic_hindi_clone') {
      // Indic voice clone: dual harmonics with high frequency artifacts
      osc.type = 'square';
      osc.frequency.setValueAtTime(180, this.audioContext.currentTime);
      gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    } else if (preset.id === 'gsm_noisy_call') {
      // 2G GSM cellular: filtered bandwidth with natural human pitch
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, this.audioContext.currentTime);
      gain.gain.setValueAtTime(0.25, this.audioContext.currentTime);
    } else {
      // Genuine Executive: natural sine/harmonic blend
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(115, this.audioContext.currentTime);
      gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    }

    // Connect to analyser for live waveform visualization (do not connect to destination to avoid loud buzz)
    osc.connect(gain);
    gain.connect(this.analyser);
    osc.start();

    this.simOscillator = osc;
    this.simGain = gain;
  }

  stopSimulation() {
    if (this.simOscillator) {
      try {
        this.simOscillator.stop();
        this.simOscillator.disconnect();
      } catch {
        // ignore
      }
      this.simOscillator = null;
    }
    if (this.simGain) {
      this.simGain.disconnect();
      this.simGain = null;
    }
    if (this.mode === 'simulation') {
      this.isRunning = false;
      this.mode = 'idle';
    }
  }

  stopAll() {
    this.stopMicrophone();
    this.stopSimulation();
    this.stopAudioFile();
  }

  getWaveformData() {
    if (!this.analyser) return new Uint8Array(512);
    const buffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(buffer);
    return buffer;
  }

  getFrequencyData() {
    if (!this.analyser) return new Uint8Array(512);
    const buffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(buffer);
    return buffer;
  }
}

export const audioEngine = new AudioEngine();
