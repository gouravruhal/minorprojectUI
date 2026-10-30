# Literature Review: Generative Voice & Audio Spoofing

## 1. Generative Text-to-Speech (TTS) & Voice Conversion (VC)
Modern speech synthesis relies on two decoupled components:
- **Acoustic Models:** Predict intermediate representations (mel-spectrograms or discrete speech tokens) from text or phonemes (e.g., FastSpeech2, VITS, Tortoise, F5-TTS).
- **Neural Vocoders:** Synthesize raw audio waveforms from spectrograms (e.g., HiFi-GAN, WaveGlow, BigVGAN).

## 2. Inherent Flaws in Neural Vocoders
- **High-Frequency Phase Inconsistencies:** Transposed convolutions in vocoders generate periodic artifacts and unnatural phase alignment above 4 kHz.
- **Over-Smoothing:** Neural models minimize MSE/L1 spectral loss, smoothing involuntary biological micro-tremors in pitch and amplitude.

## 3. ASV & Prior Detection Architectures
- **ASVspoof Challenges:** Benchmarked LFCC, CQCC, and RawNet2. While effective on clean audio, baseline models degrade significantly under low-bitrate telephony compression.
- **VoiceShield Advantage:** Extracts biological glottal dynamics and wideband spectral cues to remain robust across compression manifolds.

