"""
=============================================================================
VoiceShield AI - Audio Sample Downloader & Precision Slicer (<= 200 lines)
=============================================================================
Downloads 5 AI synthetic voice samples and 5 genuine human voice samples
from public research repositories, slices them to exactly 2.5 seconds (2-3s),
and stores them into the designated download folders for forensic evaluation.
=============================================================================
"""

import os
import io
import json
import shutil
import urllib.request
import numpy as np
import scipy.signal
import soundfile as sf

TARGET_DURATION_SEC = 2.5
TARGET_SAMPLE_RATE = 16000

AI_SOURCE_URLS = [
    ("ai_sample_1.wav", "https://raw.githubusercontent.com/jik876/hifi-gan-demo/master/samples/e2e/HGAN_V1/e2e_hgan_v1_1.wav", "HiFi-GAN V1 Neural Vocoder Synthetic Voice (Sample 1)"),
    ("ai_sample_2.wav", "https://raw.githubusercontent.com/jik876/hifi-gan-demo/master/samples/e2e/HGAN_V1/e2e_hgan_v1_2.wav", "HiFi-GAN V1 Neural Vocoder Synthetic Voice (Sample 2)"),
    ("ai_sample_3.wav", "https://raw.githubusercontent.com/jik876/hifi-gan-demo/master/samples/e2e/HGAN_V1/e2e_hgan_v1_3.wav", "HiFi-GAN V1 Neural Vocoder Synthetic Voice (Sample 3)"),
    ("ai_sample_4.wav", "https://raw.githubusercontent.com/jik876/hifi-gan-demo/master/samples/e2e/HGAN_V1/e2e_hgan_v1_4.wav", "HiFi-GAN V1 Neural Vocoder Synthetic Voice (Sample 4)"),
    ("ai_sample_5.wav", "https://raw.githubusercontent.com/jik876/hifi-gan-demo/master/samples/e2e/HGAN_V1/e2e_hgan_v1_5.wav", "HiFi-GAN V1 Neural Vocoder Synthetic Voice (Sample 5)"),
]

HUMAN_SOURCE_URLS = [
    ("human_sample_1.wav", "https://raw.githubusercontent.com/jik876/hifi-gan-demo/master/samples/e2e/GT/e2e_gt_1.wav", "Bona Fide Human Ground Truth Voice (Sample 1)"),
    ("human_sample_2.wav", "https://raw.githubusercontent.com/jik876/hifi-gan-demo/master/samples/e2e/GT/e2e_gt_2.wav", "Bona Fide Human Ground Truth Voice (Sample 2)"),
    ("human_sample_3.wav", "https://raw.githubusercontent.com/jik876/hifi-gan-demo/master/samples/e2e/GT/e2e_gt_3.wav", "Bona Fide Human Ground Truth Voice (Sample 3)"),
    ("human_sample_4.wav", "https://raw.githubusercontent.com/jik876/hifi-gan-demo/master/samples/e2e/GT/e2e_gt_4.wav", "Bona Fide Human Ground Truth Voice (Sample 4)"),
    ("human_sample_5.wav", "https://raw.githubusercontent.com/jik876/hifi-gan-demo/master/samples/e2e/GT/e2e_gt_5.wav", "Bona Fide Human Ground Truth Voice (Sample 5)"),
]


def download_and_slice(url: str, target_sec: float = 2.5, target_sr: int = 16000) -> tuple:
    """Download audio, resample to 16kHz, and slice precisely to target_sec."""
    req = urllib.request.Request(url, headers={'User-Agent': 'VoiceShield-Downloader/1.0'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        audio_bytes = resp.read()

    data, orig_sr = sf.read(io.BytesIO(audio_bytes), dtype='float32')
    if data.ndim > 1:
        data = np.mean(data, axis=1)

    # Resample to 16kHz if needed
    if orig_sr != target_sr:
        num_target_samples = int(round(len(data) * float(target_sr) / orig_sr))
        data = scipy.signal.resample(data, num_target_samples)

    # Slicing window: start from 0.5s to avoid leading silence / onset clicks
    target_len = int(target_sec * target_sr)
    start_sample = int(0.5 * target_sr)

    if len(data) >= start_sample + target_len:
        sliced = data[start_sample : start_sample + target_len]
    elif len(data) >= target_len:
        sliced = data[:target_len]
    else:
        # Pad if shorter than target
        sliced = np.pad(data, (0, target_len - len(data)), mode='constant')

    # Peak normalize to -1.0 dBFS to ensure clean playback without clipping
    peak = np.max(np.abs(sliced))
    if peak > 1e-4:
        sliced = (sliced / peak) * 0.89

    actual_duration = len(sliced) / target_sr
    return sliced, target_sr, actual_duration


def main():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    local_download_dir = os.path.join(project_root, "downloads")
    user_download_dir = os.path.join(os.path.expanduser("~"), "Downloads", "VoiceShield_Samples")

    os.makedirs(local_download_dir, exist_ok=True)
    os.makedirs(os.path.join(local_download_dir, "ai_samples"), exist_ok=True)
    os.makedirs(os.path.join(local_download_dir, "human_samples"), exist_ok=True)
    os.makedirs(user_download_dir, exist_ok=True)

    manifest = {"ai_samples": [], "human_samples": []}

    print("=" * 65)
    print("VoiceShield AI: Downloading & Preparing Voice Samples (2.5s @ 16kHz)")
    print("=" * 65)

    # 1. Download 5 AI Voice Samples
    print("\n[+] Downloading 5 AI Synthetic Voice Samples...")
    for filename, url, desc in AI_SOURCE_URLS:
        print(f" -> Fetching {filename} from {url}...")
        audio, sr, dur = download_and_slice(url, TARGET_DURATION_SEC, TARGET_SAMPLE_RATE)
        
        # Save to local downloads
        p1 = os.path.join(local_download_dir, filename)
        p2 = os.path.join(local_download_dir, "ai_samples", filename)
        sf.write(p1, audio, sr, subtype='PCM_16')
        sf.write(p2, audio, sr, subtype='PCM_16')

        # Copy to user's Windows Downloads directory
        p3 = os.path.join(user_download_dir, filename)
        shutil.copyfile(p1, p3)

        manifest["ai_samples"].append({
            "filename": filename,
            "type": "AI_SYNTHETIC",
            "duration_sec": round(dur, 2),
            "sample_rate": sr,
            "description": desc,
            "source_url": url,
            "local_path": p1,
            "downloads_path": p3
        })
        print(f"    Saved: {filename} ({dur:.2f}s, {sr}Hz, PCM_16)")

    # 2. Download 5 Human Voice Samples
    print("\n[+] Downloading 5 Human Genuine Voice Samples...")
    for filename, url, desc in HUMAN_SOURCE_URLS:
        print(f" -> Fetching {filename} from {url}...")
        audio, sr, dur = download_and_slice(url, TARGET_DURATION_SEC, TARGET_SAMPLE_RATE)
        
        p1 = os.path.join(local_download_dir, filename)
        p2 = os.path.join(local_download_dir, "human_samples", filename)
        sf.write(p1, audio, sr, subtype='PCM_16')
        sf.write(p2, audio, sr, subtype='PCM_16')

        p3 = os.path.join(user_download_dir, filename)
        shutil.copyfile(p1, p3)

        manifest["human_samples"].append({
            "filename": filename,
            "type": "BONA_FIDE_HUMAN",
            "duration_sec": round(dur, 2),
            "sample_rate": sr,
            "description": desc,
            "source_url": url,
            "local_path": p1,
            "downloads_path": p3
        })
        print(f"    Saved: {filename} ({dur:.2f}s, {sr}Hz, PCM_16)")

    # Save manifest
    manifest_path = os.path.join(local_download_dir, "samples_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    shutil.copyfile(manifest_path, os.path.join(user_download_dir, "samples_manifest.json"))

    print("\n" + "=" * 65)
    print(f"[SUCCESS] 5 AI and 5 Human samples downloaded and sliced (2.50s each)!")
    print(f"Project Folder: {local_download_dir}")
    print(f"User Downloads: {user_download_dir}")
    print("=" * 65)


if __name__ == "__main__":
    main()

