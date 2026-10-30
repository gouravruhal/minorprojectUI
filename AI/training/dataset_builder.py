"""
Benchmark dataset generator for voice deepfake detection.
Synthesizes acoustic feature distributions modeled on ASVspoof, ElevenLabs, and AMR codecs.
"""
import numpy as np

def generate_benchmark_dataset(n_samples: int = 1200, seed: int = 42):
    """
    Generates a controlled, reproducible dataset of acoustic and biomechanical feature vectors.
    Returns: X_train, y_train, X_test, y_test
    Label 0: Authentic Human Speech
    Label 1: Potentially Synthetic / AI-Generated Speech
    """
    np.random.seed(seed)
    n_class = n_samples // 2
    n_features = 19  # 7 base metrics + 12 LFCCs

    # 1. Genuine Human Speech Manifolds
    human_f0 = np.random.uniform(90, 250, n_class)
    human_jitter = np.random.uniform(0.55, 1.85, n_class)
    human_shimmer = np.random.uniform(1.6, 3.8, n_class)
    human_hnr = np.random.uniform(14.0, 23.5, n_class)
    human_centroid = np.random.uniform(1400, 2600, n_class)
    human_rolloff = np.random.uniform(2800, 4800, n_class)
    human_hf_ratio = np.random.uniform(0.08, 0.22, n_class)
    human_lfcc = np.random.normal(loc=0.0, scale=1.0, size=(n_class, 12))

    X_human = np.column_stack([
        human_f0, human_jitter, human_shimmer, human_hnr,
        human_centroid, human_rolloff, human_hf_ratio, human_lfcc
    ])
    y_human = np.zeros(n_class, dtype=int)

    # 2. Synthetic Speech Manifolds (ElevenLabs, HiFi-GAN, BigVGAN)
    synth_f0 = np.random.uniform(95, 240, n_class)
    synth_jitter = np.concatenate([
        np.random.uniform(0.06, 0.24, n_class // 2),  # Over-smoothed neural vocoder
        np.random.uniform(3.8, 5.5, n_class - n_class // 2)  # Phase drift artifact
    ])
    synth_shimmer = np.random.uniform(0.35, 0.88, n_class)
    synth_hnr = np.random.uniform(25.5, 34.0, n_class)
    synth_centroid = np.random.uniform(1800, 3200, n_class)
    synth_rolloff = np.random.uniform(3600, 5800, n_class)
    synth_hf_ratio = np.random.uniform(0.28, 0.46, n_class)
    synth_lfcc = np.random.normal(loc=1.2, scale=1.2, size=(n_class, 12))

    X_synth = np.column_stack([
        synth_f0, synth_jitter, synth_shimmer, synth_hnr,
        synth_centroid, synth_rolloff, synth_hf_ratio, synth_lfcc
    ])
    y_synth = np.ones(n_class, dtype=int)

    # Combine and shuffle
    X = np.vstack([X_human, X_synth])
    y = np.concatenate([y_human, y_synth])

    indices = np.random.permutation(len(X))
    X, y = X[indices], y[indices]

    # Split into 80% train, 20% held-out test
    split = int(0.80 * len(X))
    return X[:split], y[:split], X[split:], y[split:]

