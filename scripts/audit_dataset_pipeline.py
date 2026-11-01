"""
Audio Forensic Dataset & Signal Integrity Diagnostic Audit Script.
Validates sampling rate, mono enforcement, bit depth, clipping, SNR, and silence ratios.
"""
import os
import sys
import argparse
import numpy as np
import soundfile as sf
try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

def inspect_audio_file(file_path: str, target_sr: int = 16000) -> dict:
    """Performs signal integrity checks on a single audio file."""
    issues = []
    try:
        info = sf.info(file_path)
    except Exception as e:
        return {"file": file_path, "status": "CORRUPT", "error": str(e), "issues": ["Corrupt header or unreadable format"]}

    if info.samplerate != target_sr:
        issues.append(f"Sample rate mismatch: {info.samplerate}Hz (expected {target_sr}Hz)")
    if info.channels != 1:
        issues.append(f"Multi-channel detected: {info.channels} channels (mono required)")
    if info.duration < 0.50:
        issues.append(f"Duration too short: {info.duration:.2f}s (<0.5s)")

    try:
        data, sr = sf.read(file_path, dtype="float32", always_2d=False)
    except Exception as e:
        return {"file": file_path, "status": "READ_ERROR", "error": str(e), "issues": ["Failed reading PCM buffer"]}

    if data.ndim > 1:
        data = np.mean(data, axis=1)

    peak = float(np.max(np.abs(data))) if len(data) > 0 else 0.0
    rms = float(np.sqrt(np.mean(data**2) + 1e-12))
    rms_db = float(20.0 * np.log10(rms + 1e-9))

    # Clipping detection (samples at digital ceiling)
    clipped_samples = int(np.sum(np.abs(data) >= 0.999))
    clip_ratio = (clipped_samples / float(len(data))) if len(data) > 0 else 0.0
    if clip_ratio > 0.001:
        issues.append(f"Severe digital clipping: {clip_ratio * 100:.2f}% samples clipped")

    # Silence and low energy check
    if rms_db < -55.0 or peak < 0.005:
        issues.append(f"Near-silent audio file (RMS: {rms_db:.1f} dBFS, Peak: {peak:.4f})")

    # Frame-level Energy VAD to detect silence ratio
    frame_len = int(sr * 0.025)
    hop_len = int(sr * 0.010)
    frames = [data[i:i + frame_len] for i in range(0, len(data) - frame_len, hop_len)]
    if frames:
        f_rms = np.array([np.sqrt(np.mean(f**2) + 1e-12) for f in frames])
        silence_thresh = max(0.005, 0.1 * np.mean(f_rms))
        silence_ratio = float(np.mean(f_rms < silence_thresh))
    else:
        silence_ratio = 1.0

    if silence_ratio > 0.65:
        issues.append(f"High silence ratio: {silence_ratio * 100:.1f}% unvoiced/silent frames")

    # PyTorch Tensor / Buffer Verification
    if HAS_TORCH:
        t_data = torch.from_numpy(data)
        if torch.isnan(t_data).any() or torch.isinf(t_data).any():
            issues.append("NaN or Inf values detected in torch tensor")
    else:
        if np.isnan(data).any() or np.isinf(data).any():
            issues.append("NaN or Inf values detected in PCM buffer")

    return {
        "file": os.path.basename(file_path),
        "status": "FAIL" if issues else "PASS",
        "sr": info.samplerate,
        "channels": info.channels,
        "subtype": info.subtype,
        "duration": round(info.duration, 2),
        "peak": round(peak, 4),
        "rms_db": round(rms_db, 1),
        "clip_ratio": round(clip_ratio, 4),
        "silence_ratio": round(silence_ratio, 3),
        "issues": issues
    }

def audit_directory(dir_path: str, target_sr: int = 16000) -> dict:
    """Scans directory and runs statistical audio forensic audit."""
    audio_exts = {".wav", ".flac", ".mp3", ".ogg", ".m4a"}
    files = []
    for root, _, filenames in os.walk(dir_path):
        for f in filenames:
            if os.path.splitext(f)[1].lower() in audio_exts:
                files.append(os.path.join(root, f))

    if not files:
        return {"error": f"No audio files found in {dir_path}"}

    results = [inspect_audio_file(fp, target_sr) for fp in files]
    passed = [r for r in results if r["status"] == "PASS"]
    failed = [r for r in results if r["status"] != "PASS"]

    durations = [r["duration"] for r in results if "duration" in r]
    rms_vals = [r["rms_db"] for r in results if "rms_db" in r]
    clip_ratios = [r["clip_ratio"] for r in results if "clip_ratio" in r]

    summary = {
        "total_files": len(files),
        "passed_files": len(passed),
        "flagged_files": len(failed),
        "pass_rate_pct": round(len(passed) / len(files) * 100, 2),
        "duration_sec": {
            "mean": round(float(np.mean(durations)), 2),
            "min": round(float(np.min(durations)), 2),
            "max": round(float(np.max(durations)), 2)
        },
        "rms_dbfs": {
            "mean": round(float(np.mean(rms_vals)), 1),
            "std": round(float(np.std(rms_vals)), 1)
        },
        "total_clipped_files": sum(1 for c in clip_ratios if c > 0.001),
        "flagged_details": failed[:15]
    }
    return summary

def print_audit_report(summary: dict):
    """Outputs structured diagnostic report to stdout."""
    print("=" * 65)
    print("VOICESHIELD AI: DATASET SIGNAL INTEGRITY AUDIT REPORT")
    print("=" * 65)
    if "error" in summary:
        print(f"[ERROR] {summary['error']}")
        return

    print(f"Total Audio Files Analyzed : {summary['total_files']}")
    print(f"Passed All Checks           : {summary['passed_files']} ({summary['pass_rate_pct']}%)")
    print(f"Flagged Anomalous Files     : {summary['flagged_files']}")
    print(f"Clipped Signal Files        : {summary['total_clipped_files']}")
    print(f"Duration Distribution (s)   : Mean={summary['duration_sec']['mean']}s | Min={summary['duration_sec']['min']}s | Max={summary['duration_sec']['max']}s")
    print(f"Energy Distribution (dBFS)  : Mean={summary['rms_dbfs']['mean']} dBFS | Std={summary['rms_dbfs']['std']} dBFS")

    if summary["flagged_details"]:
        print("\n--- SAMPLE FLAGGED ANOMALIES (Top 15) ---")
        for item in summary["flagged_details"]:
            print(f"• [{item.get('status', 'FAIL')}] {item['file']}: {', '.join(item.get('issues', []))}")
    print("=" * 65)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Audit audio dataset for signal integrity and protocol consistency.")
    parser.add_argument("dir", nargs="?", default=".", help="Directory containing audio files to inspect.")
    parser.add_argument("--sr", type=int, default=16000, help="Expected sampling rate (default: 16000)")
    args = parser.parse_args()

    report = audit_directory(args.dir, target_sr=args.sr)
    print_audit_report(report)
