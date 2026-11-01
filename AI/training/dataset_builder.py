"""
Benchmark dataset generator for audio forensic training.
Simulates modern AI voice clones (ElevenLabs, OpenAI, VITS), compressed TTS, and human speech.
"""
import numpy as np

def generate_benchmark_dataset(n_samples: int = 3000, seed: int = 42, mode: str = "temporal_long"):
    """Generates multi-condition forensic manifolds covering clean, lossy, and compressed audio."""
    np.random.seed(seed)
    n_class = n_samples // 2

    if mode == "temporal_long":
        # 26 dimensions:
        # [0: f0_m, 1: f0_std, 2: j_m, 3: j_std, 4: j_min, 5: s_m, 6: s_std,
        #  7: hnr_m, 8: hnr_std, 9: cent_m, 10: roll_m, 11: hf_m, 12: hf_std, 13: flux, 14-25: lfcc(12)]

        # 1. Authentic Human Speech (Diverse Male, Female, Accents, and Ambient Noise)
        h_f0_m = np.random.uniform(85, 275, n_class)
        h_f0_std = np.random.uniform(18.0, 52.0, n_class)   # Organic prosodic drift & breath
        h_j_m = np.random.uniform(0.48, 1.95, n_class)     # Biological micro-tremor
        h_j_std = np.random.uniform(0.12, 0.50, n_class)   # Natural perturbation variance
        h_j_min = np.random.uniform(0.30, 0.75, n_class)
        h_s_m = np.random.uniform(1.60, 4.20, n_class)     # Biological amplitude perturbation
        h_s_std = np.random.uniform(0.35, 1.10, n_class)
        h_hnr_m = np.random.uniform(12.0, 22.5, n_class)   # Natural vocal tract noise
        h_hnr_std = np.random.uniform(2.0, 5.5, n_class)
        h_cent_m = np.random.uniform(1200, 2700, n_class)
        h_roll_m = np.random.uniform(2500, 4800, n_class)
        h_hf_m = np.random.uniform(0.06, 0.22, n_class)    # Natural high-frequency roll-off
        h_hf_std = np.random.uniform(0.01, 0.08, n_class)
        h_flux = np.random.uniform(45.0, 175.0, n_class)   # Continuous articulatory formant shifts
        h_lfcc = np.random.normal(loc=0.0, scale=1.0, size=(n_class, 12))

        X_human = np.column_stack([
            h_f0_m, h_f0_std, h_j_m, h_j_std, h_j_min, h_s_m, h_s_std,
            h_hnr_m, h_hnr_std, h_cent_m, h_roll_m, h_hf_m, h_hf_std, h_flux, h_lfcc
        ])
        y_human = np.zeros(n_class, dtype=int)

        # 2. Synthetic Speech (Modern Clones, Lossy Compressed TTS, and Neural Vocoders)
        n_half = n_class // 2
        # 2A: Clean High-Quality Neural TTS (ElevenLabs, OpenAI, VITS)
        s_f0_clean = np.random.uniform(90, 245, n_half)
        s_f0_std_clean = np.random.uniform(3.5, 14.5, n_half) # Unnaturally rigid prosody
        s_j_clean = np.random.uniform(0.04, 0.25, n_half)     # Suppressed glottal jitter
        s_j_std_clean = np.random.uniform(0.01, 0.07, n_half)
        s_j_min_clean = np.random.uniform(0.02, 0.16, n_half)
        s_s_clean = np.random.uniform(0.30, 0.90, n_half)     # Suppressed shimmer
        s_s_std_clean = np.random.uniform(0.05, 0.22, n_half)
        s_hnr_clean = np.random.uniform(24.5, 34.0, n_half)   # Excessive harmonicity
        s_hnr_std_clean = np.random.uniform(0.6, 2.2, n_half)
        s_cent_clean = np.random.uniform(1800, 3400, n_half)
        s_roll_clean = np.random.uniform(3600, 6000, n_half)
        s_hf_clean = np.random.uniform(0.26, 0.52, n_half)    # Transposed convolution aliasing
        s_hf_std_clean = np.random.uniform(0.01, 0.06, n_half)
        s_flux_clean = np.random.uniform(10.0, 42.0, n_half)  # Over-regular frame transitions
        s_lfcc_clean = np.random.normal(loc=1.3, scale=1.1, size=(n_half, 12))

        # 2B: Compressed / Lossy / Accented AI Audio (MP3, Opus, WhatsApp, TikTok, RVC)
        n_comp = n_class - n_half
        s_f0_comp = np.random.uniform(95, 250, n_comp)
        s_f0_std_comp = np.random.uniform(4.0, 16.0, n_comp)  # Prosody still flatter than human
        s_j_comp = np.random.uniform(0.25, 0.58, n_comp)      # Compression elevates jitter slightly
        s_j_std_comp = np.random.uniform(0.03, 0.14, n_comp)
        s_j_min_comp = np.random.uniform(0.12, 0.32, n_comp)
        s_s_comp = np.random.uniform(0.85, 1.85, n_comp)      # Compression elevates shimmer
        s_s_std_comp = np.random.uniform(0.12, 0.40, n_comp)
        s_hnr_comp = np.random.uniform(17.0, 26.5, n_comp)    # Noise floor lowers HNR
        s_hnr_std_comp = np.random.uniform(1.2, 3.2, n_comp)
        s_cent_comp = np.random.uniform(1900, 3500, n_comp)
        s_roll_comp = np.random.uniform(3400, 5800, n_comp)
        s_hf_comp = np.random.uniform(0.23, 0.44, n_comp)     # Aliasing still elevated
        s_hf_std_comp = np.random.uniform(0.02, 0.08, n_comp)
        s_flux_comp = np.random.uniform(18.0, 52.0, n_comp)
        s_lfcc_comp = np.random.normal(loc=1.1, scale=1.3, size=(n_comp, 12))

        X_synth = np.vstack([
            np.column_stack([s_f0_clean, s_f0_std_clean, s_j_clean, s_j_std_clean, s_j_min_clean,
                             s_s_clean, s_s_std_clean, s_hnr_clean, s_hnr_std_clean, s_cent_clean,
                             s_roll_clean, s_hf_clean, s_hf_std_clean, s_flux_clean, s_lfcc_clean]),
            np.column_stack([s_f0_comp, s_f0_std_comp, s_j_comp, s_j_std_comp, s_j_min_comp,
                             s_s_comp, s_s_std_comp, s_hnr_comp, s_hnr_std_comp, s_cent_comp,
                             s_roll_comp, s_hf_comp, s_hf_std_comp, s_flux_comp, s_lfcc_comp])
        ])
        y_synth = np.ones(n_class, dtype=int)

    else:
        # 19 dimensions (segment-level)
        h_f0 = np.random.uniform(85, 275, n_class)
        h_j = np.random.uniform(0.48, 1.95, n_class)
        h_s = np.random.uniform(1.60, 4.20, n_class)
        h_hnr = np.random.uniform(12.0, 22.5, n_class)
        h_cent = np.random.uniform(1200, 2700, n_class)
        h_roll = np.random.uniform(2500, 4800, n_class)
        h_hf = np.random.uniform(0.06, 0.22, n_class)
        h_lfcc = np.random.normal(loc=0.0, scale=1.0, size=(n_class, 12))
        X_human = np.column_stack([h_f0, h_j, h_s, h_hnr, h_cent, h_roll, h_hf, h_lfcc])
        y_human = np.zeros(n_class, dtype=int)

        n_half = n_class // 2
        s_f0 = np.concatenate([np.random.uniform(90, 245, n_half), np.random.uniform(95, 250, n_class - n_half)])
        s_j = np.concatenate([np.random.uniform(0.04, 0.25, n_half), np.random.uniform(0.25, 0.58, n_class - n_half)])
        s_s = np.concatenate([np.random.uniform(0.30, 0.90, n_half), np.random.uniform(0.85, 1.85, n_class - n_half)])
        s_hnr = np.concatenate([np.random.uniform(24.5, 34.0, n_half), np.random.uniform(17.0, 26.5, n_class - n_half)])
        s_cent = np.random.uniform(1800, 3500, n_class)
        s_roll = np.random.uniform(3400, 6000, n_class)
        s_hf = np.concatenate([np.random.uniform(0.26, 0.52, n_half), np.random.uniform(0.23, 0.44, n_class - n_half)])
        s_lfcc = np.random.normal(loc=1.2, scale=1.2, size=(n_class, 12))
        X_synth = np.column_stack([s_f0, s_j, s_s, s_hnr, s_cent, s_roll, s_hf, s_lfcc])
        y_synth = np.ones(n_class, dtype=int)

    X = np.vstack([X_human, X_synth])
    y = np.concatenate([y_human, y_synth])
    idx = np.random.permutation(len(X))
    X, y = X[idx], y[idx]
    split = int(0.80 * len(X))
    return X[:split], y[:split], X[split:], y[split:]
