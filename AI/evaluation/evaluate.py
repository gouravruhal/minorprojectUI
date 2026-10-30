"""
Reproducible evaluation script for the VoiceShield AI detection model.
Calculates Accuracy, Precision, Recall, F1, FPR, FNR, Confusion Matrix, and Latency.
"""
import os
import sys
import time
import numpy as np

root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from AI.models.classifier import AcousticForensicClassifier
from AI.training.dataset_builder import generate_benchmark_dataset

def run_evaluation():
    print("=" * 60)
    print("VoiceShield AI: Independent Held-Out Benchmark Evaluation")
    print("=" * 60)

    model_path = os.path.join(root_dir, "AI", "models", "checkpoint.joblib")
    if not os.path.exists(model_path):
        print(f"Model checkpoint not found at {model_path}. Please run train.py first.")
        sys.exit(1)

    classifier = AcousticForensicClassifier().load(model_path)

    # Held-out split with independent seed
    _, _, X_test, y_test = generate_benchmark_dataset(n_samples=1000, seed=999)
    print(f"Evaluating on {len(X_test)} independent test audio feature vectors...")

    latencies = []
    y_preds = []

    for f_vec in X_test:
        t0 = time.perf_counter()
        score = classifier.predict_synthetic_score(f_vec)
        latencies.append((time.perf_counter() - t0) * 1000.0)
        y_preds.append(1 if score >= 50.0 else 0)

    y_preds = np.array(y_preds)
    tp = int(np.sum((y_preds == 1) & (y_test == 1)))
    tn = int(np.sum((y_preds == 0) & (y_test == 0)))
    fp = int(np.sum((y_preds == 1) & (y_test == 0)))
    fn = int(np.sum((y_preds == 0) & (y_test == 1)))

    acc = (tp + tn) / float(len(y_test))
    precision = tp / float(tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / float(tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    fpr = fp / float(fp + tn) if (fp + tn) > 0 else 0.0
    fnr = fn / float(fn + tp) if (fn + tp) > 0 else 0.0
    avg_latency = float(np.mean(latencies))

    print("\n--- BENCHMARK RESULTS ---")
    print(f"Accuracy:           {acc * 100.0:.2f}%")
    print(f"Precision:          {precision * 100.0:.2f}%")
    print(f"Recall:             {recall * 100.0:.2f}%")
    print(f"F1-Score:           {f1 * 100.0:.2f}%")
    print(f"False Positive Rate:{fpr * 100.0:.2f}%")
    print(f"False Negative Rate:{fnr * 100.0:.2f}%")
    print(f"Mean Latency:       {avg_latency:.2f} ms per frame")
    print(f"Confusion Matrix:   [[TN={tn}, FP={fp}], [FN={fn}, TP={tp}]]")
    print("=" * 60)

    return {
        "accuracy": acc, "precision": precision, "recall": recall, "f1": f1,
        "fpr": fpr, "fnr": fnr, "latency_ms": avg_latency
    }

if __name__ == "__main__":
    run_evaluation()

