"""
Master Production Training Script for VoiceShield AI.
Trains both Voice Detection Dual-Head Ensemble and Forensic LLM Reasoner.
"""
import os
import sys
import json
import time
import numpy as np

root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from AI.models.classifier import AcousticForensicClassifier
from AI.training.dataset_builder import generate_benchmark_dataset
from AI.training.train_forensic_llm import run_llm_training

def train_production_pipeline():
    start_time = time.time()
    print("*" * 65)
    print("VOICESHIELD AI: PRODUCTION SYSTEM TRAINING PIPELINE")
    print("*" * 65)

    # 1. Synthesize and Train Voice AI Dual-Head Ensemble
    print("\n[PHASE 1] Training Voice AI Dual-Head Ensemble (Segments + 10-30s Dynamics)")
    X_seg_tr, y_seg_tr, X_seg_val, y_seg_val = generate_benchmark_dataset(n_samples=2400, mode="segment")
    X_tmp_tr, y_tmp_tr, X_tmp_val, y_tmp_val = generate_benchmark_dataset(n_samples=2400, mode="temporal_long")

    classifier = AcousticForensicClassifier()
    classifier.fit_dual(X_seg_tr, y_seg_tr, X_tmp_tr, y_tmp_tr)

    val_seg_preds = classifier.predict_proba(X_seg_val)[:, 1] >= 0.5
    seg_acc = float(np.mean(val_seg_preds == y_seg_val) * 100.0)
    val_tmp_preds = classifier.predict_proba(X_tmp_val)[:, 1] >= 0.5
    tmp_acc = float(np.mean(val_tmp_preds == y_tmp_val) * 100.0)

    print(f"Segment Accuracy (19-dim windows): {seg_acc:.2f}%")
    print(f"Temporal Accuracy (28-dim 10-30s): {tmp_acc:.2f}%")

    model_ckpt = os.path.join(root_dir, "AI", "models", "checkpoint.joblib")
    classifier.save(model_ckpt)
    print(f"Voice AI checkpoint successfully saved: {model_ckpt}")

    # 2. Train Forensic LLM Reasoner
    print("\n[PHASE 2] Training Production Acoustic Forensic LLM")
    llm_reasoner = run_llm_training()

    # 3. Export Production Report Metadata
    elapsed = round(time.time() - start_time, 2)
    report = {
        "status": "production_ready",
        "voice_ai": {
            "model_type": "Dual-Head GradientBoosting + ExtraTrees",
            "segment_accuracy": seg_acc,
            "temporal_accuracy": tmp_acc,
            "checkpoint": model_ckpt
        },
        "forensic_llm": {
            "engine": "ForensicLLMReasoner",
            "weights_checkpoint": os.path.join(root_dir, "AI", "models", "forensic_llm_weights.joblib"),
            "features_covered": ["threat_tier", "biomechanics", "neural_vocoder", "timeline_logs", "actionable_protocol"]
        },
        "training_duration_seconds": elapsed,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    }

    report_path = os.path.join(root_dir, "AI", "models", "production_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print("\n" + "*" * 65)
    print(f"ALL PRODUCTION TRAINING COMPLETED SUCCESSFULLY in {elapsed}s!")
    print(f"Production Report exported to: {report_path}")
    print("*" * 65)
    return report

if __name__ == "__main__":
    train_production_pipeline()

