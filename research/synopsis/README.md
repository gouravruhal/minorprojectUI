# VoiceShield AI: Project Synopsis

## 1. Problem Statement
Generative AI voice synthesis technologies (such as ElevenLabs, XTTS-v2, and modern diffusion models) can clone a human speaker's voice using only 3–10 seconds of reference audio. This enables high-impact social engineering attacks:
- **Executive Impersonation (Whaling):** Fraudulent wire transfers authorized via cloned CXO voices.
- **Family Distress Scams:** Extorting ransom by simulating kidnapped family members.
- **Call-Center Social Engineering:** Bypassing customer support authentication.

## 2. Research Objectives
1. Provide real-time, low-latency (<250ms) detection of synthetic speech.
2. Establish physical vocal-tract and glottal micro-perturbation metrics (Jitter PPQ5, Shimmer APQ3) resilient against acoustic mimicry.
3. Overcome compression bottlenecks of Indian mobile networks (VoLTE AMR-WB, GSM-FR).
4. Build a modular multi-stream forensic pipeline combining acoustic DSP with machine learning.

