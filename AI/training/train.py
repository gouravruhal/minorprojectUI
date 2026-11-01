"""
Training workflow for VoiceShield AI's Multi-Resolution Acoustic Ensemble.
Trains dual-head classifier over 19-dim segment windows and 26-dim temporal manifolds.
"""
import os
import sys
import numpy as np

root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from AI.models.classifier import AcousticForensicClassifier
from AI.training.dataset_builder import generate_benchmark_dataset

def run_training():
    print("=" * 60)
    print("VoiceShield AI: Training Dual-Head Forensic Acoustic Ensemble")
    print("=" * 60)

    X_seg_tr, y_seg_tr, X_seg_val, y_seg_val = generate_benchmark_dataset(n_samples=2400, mode="segment")
    X_tmp_tr, y_tmp_tr, X_tmp_val, y_tmp_val = generate_benchmark_dataset(n_samples=2400, mode="temporal_long")

    classifier = AcousticForensicClassifier()
    classifier.fit_dual(X_seg_tr, y_seg_tr, X_tmp_tr, y_tmp_tr)

    val_seg_preds = classifier.predict_proba(X_seg_val)[:, 1] >= 0.5
    seg_acc = float(np.mean(val_seg_preds == y_seg_val) * 100.0)
    val_tmp_preds = classifier.predict_proba(X_tmp_val)[:, 1] >= 0.5
    tmp_acc = float(np.mean(val_tmp_preds == y_tmp_val) * 100.0)

    print(f"Segment Accuracy (19-dim): {seg_acc:.2f}%")
    print(f"Temporal Accuracy (26-dim): {tmp_acc:.2f}%")

    model_path = os.path.join(root_dir, "AI", "models", "checkpoint.joblib")
    classifier.save(model_path)
    print(f"[SUCCESS] Production Dual-Head checkpoint saved to: {model_path}")
    print("=" * 60)
    return classifier

if __name__ == "__main__":
    run_training()
