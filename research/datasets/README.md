# Datasets & Indian Telephony Context

## 1. Benchmark Datasets
- **ASVspoof 2019/2021 LA (Logical Access):** High-quality genuine speech and synthetic/VC attacks generated across 19 speech algorithms.
- **In-the-Wild Deepfake Voice Benchmarks:** Zero-shot clones from modern generative APIs (ElevenLabs, PlayHT, XTTS-v2).

## 2. Indian Telephony Codec Simulation
To simulate Indian telecom networks (Jio, Airtel, Vi, BSNL):
- **AMR-WB (Adaptive Multi-Rate Wideband):** Bitrates of 6.60 to 23.85 kbps, 16kHz sampling, G.722.2 standard.
- **AMR-NB (Narrowband):** 4.75 to 12.2 kbps, 8kHz telecom band.
- Codec simulation applies bandpass filtering, quantization, and packet loss concealment to prevent false alarms on genuine compressed calls.

