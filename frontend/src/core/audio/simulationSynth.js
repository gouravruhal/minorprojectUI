/**
 * Synthesizes dynamic harmonics for simulation presets to feed Web Audio analyser.
 */
export function createSimulationSynth(audioContext, analyser, preset) {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  if (preset?.id === 'elevenlabs_cxo') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(145, audioContext.currentTime);
    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
  } else if (preset?.id === 'indic_hindi_clone') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, audioContext.currentTime);
    gain.gain.setValueAtTime(0.15, audioContext.currentTime);
  } else if (preset?.id === 'gsm_noisy_call') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, audioContext.currentTime);
    gain.gain.setValueAtTime(0.25, audioContext.currentTime);
  } else {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(115, audioContext.currentTime);
    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
  }

  osc.connect(gain);
  gain.connect(analyser);
  osc.start();

  return { osc, gain };
}

