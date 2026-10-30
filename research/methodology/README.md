# Detection Methodology & Acoustic Physics

## 1. Biomechanical Vocal Fold Diagnostics
Human phonation results from subglottal pressure passing through vibrating vocal folds:
- **Glottal Jitter (PPQ5):** 5-point pitch perturbation quotient measuring cycle-to-cycle frequency tremor. Normal human range: $0.50\% - 2.0\%$. Neural synthesizers typically drop below $0.25\%$.
- **Glottal Shimmer (APQ3):** 3-point amplitude perturbation quotient measuring micro-variations in peak amplitude. Normal human range: $1.5\% - 4.5\%$.
- **Harmonic-to-Noise Ratio (HNR):** Ratio of periodic energy to aperiodic noise. Overly clean synthetic vocoders often exceed $28\text{ dB}$.

## 2. Linear Frequency Cepstral Coefficients (LFCC)
Linear filterbanks (60 filters, 0–8000 Hz) preserve high-frequency information where neural vocoders produce distinct harmonic distortion artifacts, unlike mel-scale representations which compress high frequencies.

## 3. Decision Logic & Fusion
Acoustic feature vectors combining Jitter, Shimmer, HNR, Spectral Centroid, Rolloff, and LFCCs are classified by an ensemble model calibrated with physiological bounds to output calibrated probabilities and Inconclusive fallbacks.

