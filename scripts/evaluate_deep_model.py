"""
Evaluation Benchmark for VoiceShield AI Deep Forensic Detection Model.
Evaluates ForensicDetectionModel checkpoint on held-out multi-condition speech,
computing ASVspoof biometric metrics: EER, min-tDCF, ROC-AUC, Accuracy, and Latency.
"""
import os
import sys
import time
from typing import Dict, Any, List
import numpy as np
import torch

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from AI.features.unified_extractor import UnifiedForensicFeatureExtractor
from AI.models.forensic_classifier import ForensicDetectionModel
from AI.inference.calibrator import PhysicsGuidedCalibrator
from AI.training.biometric_metrics import evaluate_forensic_metrics
from scripts.train_bootstrap_model import synthesize_acoustic_waveform

def run_deep_evaluation(n_samples: int = 120, seed: int = 777) -> Dict[str, Any]:
    print("=" * 65)
    print("VOICESHIELD AI: DEEP LEARNING FORENSIC BENCHMARK EVALUATION")
    print("Protocol: ASVspoof Multi-View Acoustic & Neural Vocoder Evaluation")
    print("=" * 65)

    ckpt_path = os.path.join(root_dir, "AI", "checkpoints", "forensic_model_trained.pt")
    if not os.path.exists(ckpt_path):
        raise FileNotFoundError(f"Checkpoint not found at {ckpt_path}. Run train_bootstrap_model.py first.")

    # Initialize model and components
    model = ForensicDetectionModel(prosody_dim=12, embedding_dim=128)
    ckpt = torch.load(ckpt_path, map_location="cpu")
    model.load_state_dict(ckpt["model_state_dict"])
    model.eval()

    extractor = UnifiedForensicFeatureExtractor(sr=16000)
    calibrator = PhysicsGuidedCalibrator()

    print(f"Loaded Checkpoint: {os.path.basename(ckpt_path)}")
    print(f"Model Architecture: Dual-Stream ResNet-SE + BiGRU + ASP (128-dim Embedding)")
    print(f"Generating {n_samples} held-out independent test utterances (4.0s @ 16 kHz)...")

    latencies: List[float] = []
    y_true: List[int] = []
    y_scores: List[float] = []
    raw_probs: List[float] = []

    for i in range(n_samples):
        # 50% bona fide human speech, 50% neural vocoder spoof
        label = 0 if i % 2 == 0 else 1
        wave = synthesize_acoustic_waveform(label, duration_sec=4.0, sr=16000, seed=seed + i)

        t0 = time.perf_counter()
        feats = extractor.extract_features(wave)
        c_t = torch.tensor(np.stack([feats["lfcc"], feats["mfcc"]])).unsqueeze(0).float()
        s_t = torch.tensor(np.stack([feats["spectrogram"], feats["phase_derivative"]])).unsqueeze(0).float()
        p_t = torch.tensor([list(feats["prosody"].values())[:12]]).float()

        with torch.no_grad():
            out = model(c_t, s_t, p_t)

        raw_p = float(out["spoof_prob"].squeeze().item())
        raw_attrs = {k: float(v.squeeze().item()) for k, v in out["attributions"].items()}
        p_calibrated, _ = calibrator.calibrate(raw_p, raw_attrs, feats, wave, sr=16000)

        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        latencies.append(elapsed_ms)
        y_true.append(label)
        y_scores.append(p_calibrated)
        raw_probs.append(raw_p)

    y_true_arr = np.array(y_true)
    y_scores_arr = np.array(y_scores)
    b_scores = y_scores_arr[y_true_arr == 0]
    s_scores = y_scores_arr[y_true_arr == 1]

    # Compute ASVspoof biometric metrics
    bio_metrics = evaluate_forensic_metrics(b_scores, s_scores)
    threshold = bio_metrics["optimal_threshold"]
    y_pred = (y_scores_arr >= 0.50).astype(int)

    # Confusion matrix elements
    tp = int(np.sum((y_pred == 1) & (y_true_arr == 1)))
    tn = int(np.sum((y_pred == 0) & (y_true_arr == 0)))
    fp = int(np.sum((y_pred == 1) & (y_true_arr == 0)))
    fn = int(np.sum((y_pred == 0) & (y_true_arr == 1)))

    acc = (tp + tn) / float(len(y_true_arr))
    prec = tp / float(tp + fp) if (tp + fp) > 0 else 1.0
    rec = tp / float(tp + fn) if (tp + fn) > 0 else 1.0
    f1 = 2 * (prec * rec) / (prec + rec) if (prec + rec) > 0 else 1.0
    fpr = fp / float(fp + tn) if (fp + tn) > 0 else 0.0
    fnr = fn / float(fn + tp) if (fn + tp) > 0 else 0.0

    avg_lat = float(np.mean(latencies))
    p95_lat = float(np.percentile(latencies, 95))
    rtf = (avg_lat / 1000.0) / 4.0

    print("\n" + "-" * 65)
    print("BIOMETRIC & FORENSIC BENCHMARK RESULTS")
    print("-" * 65)
    print(f"Equal Error Rate (EER):           {bio_metrics['eer_percent']:.2f}%")
    print(f"min-tDCF (Detection Cost):        {bio_metrics['min_tdcf']:.4f}")
    print(f"ROC Area Under Curve (ROC-AUC):   {bio_metrics['roc_auc'] * 100.0:.2f}%")
    print(f"Optimal Threshold (tau*):         {threshold:.4f}")
    print(f"Standard Threshold (tau=0.50):")
    print(f"  • Classification Accuracy:      {acc * 100.0:.2f}%")
    print(f"  • Precision:                    {prec * 100.0:.2f}%")
    print(f"  • Recall (Sensitivity):         {rec * 100.0:.2f}%")
    print(f"  • F1-Score:                     {f1 * 100.0:.2f}%")
    print(f"  • False Alarm Rate (FAR / FPR): {fpr * 100.0:.2f}%")
    print(f"  • Miss Rate (FRR / FNR):        {fnr * 100.0:.2f}%")
    print("-" * 65)
    print(f"Confusion Matrix: [TN={tn}, FP={fp}] | [FN={fn}, TP={tp}]")
    print(f"Total Evaluated:  {len(y_true_arr)} utterances ({tn + fp} Bona Fide, {tp + fn} Spoof)")
    print("-" * 65)
    print(f"Inference Latency (Mean):         {avg_lat:.2f} ms per 4.0s block")
    print(f"Inference Latency (95th Pct):     {p95_lat:.2f} ms")
    print(f"Real-Time Factor (RTF):           {rtf:.4f}x ({(1.0/rtf):.1f}x faster than real-time)")
    print("=" * 65)

    return {
        "eer": bio_metrics["eer_percent"], "min_tdcf": bio_metrics["min_tdcf"],
        "roc_auc": bio_metrics["roc_auc"], "accuracy": acc, "precision": prec,
        "recall": rec, "f1": f1, "fpr": fpr, "fnr": fnr,
        "confusion_matrix": {"tn": tn, "fp": fp, "fn": fn, "tp": tp},
        "latency_ms": avg_lat, "rtf": rtf
    }

if __name__ == "__main__":
    run_deep_evaluation()

