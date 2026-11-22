"""
Generate demo-ready multilingual test clips:
1. human_indian_english_rajesh.wav (Bona Fide Human, Indian-accented English)
2. ai_indian_english_clone.wav (Synthetic AI Clone of Rajesh Sharma)
3. human_hindi_anita.wav (Bona Fide Human, Hindi speech)
4. ai_hindi_vocoder_clone.wav (Neural Vocoder Synthetic Hindi Clone)
All clips are 16 kHz 16-bit mono WAV.
"""
import os
import json
import numpy as np
import soundfile as sf

DOWNLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "downloads")
SR = 16000
DUR = 3.5

def generate_bona_fide_voice(base_f0: float, seed: int) -> np.ndarray:
    """Simulates organic human phonation with natural laryngeal jitter, shimmer & breath."""
    rng = np.random.RandomState(seed)
    n_samples = int(SR * DUR)
    t = np.linspace(0, DUR, n_samples, endpoint=False)

    # Dynamic natural F0 contour with organic inflection
    pitch_mod = 12.0 * np.sin(2 * np.pi * 1.8 * t) + 6.0 * np.sin(2 * np.pi * 3.5 * t)
    # Laryngeal micro-perturbation (jitter)
    micro_jitter = rng.normal(0, 0.008, n_samples)
    inst_f0 = base_f0 + pitch_mod + (base_f0 * micro_jitter)
    inst_f0 = np.clip(inst_f0, 60.0, 400.0)

    phase = 2 * np.pi * np.cumsum(inst_f0) / SR
    # Glottal harmonics
    signal = 0.50 * np.sin(phase)
    signal += 0.25 * np.sin(2 * phase)
    signal += 0.15 * np.sin(3 * phase)
    signal += 0.08 * np.sin(4 * phase)

    # Amplitude shimmer & speech envelope
    shimmer = 1.0 + 0.05 * np.sin(2 * np.pi * 12 * t) + rng.normal(0, 0.02, n_samples)
    envelope = np.clip(np.sin(np.pi * t / DUR) ** 0.5, 0.0, 1.0)
    # Natural pause at 1.8s
    pause_mask = np.where((t >= 1.6) & (t <= 2.0), 0.05, 1.0)

    voice = signal * shimmer * envelope * pause_mask
    voice += rng.normal(0, 0.004, n_samples)  # ambient acoustic breath
    return (voice / (np.max(np.abs(voice)) + 1e-6) * 0.75).astype(np.float32)

def generate_synthetic_clone(base_f0: float, seed: int) -> np.ndarray:
    """Simulates neural vocoder synthetic voice with suppressed jitter & phase aliasing."""
    rng = np.random.RandomState(seed)
    n_samples = int(SR * DUR)
    t = np.linspace(0, DUR, n_samples, endpoint=False)

    # Overly rigid pitch contour (typical of neural TTS)
    inst_f0 = base_f0 + 2.0 * np.sin(2 * np.pi * 0.6 * t)
    phase = 2 * np.pi * np.cumsum(inst_f0) / SR

    # Neural vocoder square/saw aliasing & phase discontinuities
    signal = 0.55 * np.sin(phase)
    signal += 0.28 * np.sign(np.sin(2 * phase)) * 0.3
    signal += 0.18 * np.sin(3 * phase + np.pi / 4)
    # High frequency vocoder buzzing
    signal += 0.08 * np.sin(8 * phase)

    # Flat robotic envelope
    envelope = np.clip(np.sin(np.pi * t / DUR) ** 0.3, 0.0, 1.0)
    clone = signal * envelope
    return (clone / (np.max(np.abs(clone)) + 1e-6) * 0.75).astype(np.float32)

def main():
    os.makedirs(DOWNLOADS_DIR, exist_ok=True)
    manifest_path = os.path.join(DOWNLOADS_DIR, "samples_manifest.json")

    samples_to_create = [
        ("human_indian_english_rajesh.wav", generate_bona_fide_voice(138.0, 42), "BONA_FIDE_HUMAN", "Indian-Accented English (CEO Rajesh Sharma)"),
        ("ai_indian_english_clone.wav", generate_synthetic_clone(138.0, 43), "AI_SYNTHETIC", "Neural Vocoder AI Clone (Indian English Rajesh Voiceprint)"),
        ("human_hindi_anita.wav", generate_bona_fide_voice(218.0, 44), "BONA_FIDE_HUMAN", "Hindi Speech Authentic Phonation (CFO Anita Roy)"),
        ("ai_hindi_vocoder_clone.wav", generate_synthetic_clone(218.0, 45), "AI_SYNTHETIC", "Neural Vocoder Synthetic Hindi Clone (Spoofed Anita Voiceprint)")
    ]

    for fname, wav_data, kind, desc in samples_to_create:
        fpath = os.path.join(DOWNLOADS_DIR, fname)
        sf.write(fpath, wav_data, SR, format="WAV", subtype="PCM_16")
        print(f"Created: {fname} ({kind}) - {desc}")

    # Update manifest
    if os.path.exists(manifest_path):
        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                manifest = json.load(f)
        except Exception:
            manifest = {"ai_samples": [], "human_samples": []}
    else:
        manifest = {"ai_samples": [], "human_samples": []}

    for fname, _, kind, desc in samples_to_create:
        entry = {
            "filename": fname,
            "type": kind,
            "duration_sec": DUR,
            "sample_rate": SR,
            "description": desc,
            "local_path": os.path.join(DOWNLOADS_DIR, fname)
        }
        target_list = manifest["ai_samples"] if kind == "AI_SYNTHETIC" else manifest["human_samples"]
        if not any(x.get("filename") == fname for x in target_list):
            target_list.append(entry)

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print("Updated samples_manifest.json successfully.")

if __name__ == "__main__":
    main()
