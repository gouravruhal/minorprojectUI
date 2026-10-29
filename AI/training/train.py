"""
Training workflow for the Acoustic Forensic Classifier.
Trains the gradient-boosted ensemble on benchmark data and saves the model artifact.
"""
import os
import sys

# Ensure root is in path
root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from AI.models.classifier import AcousticForensicClassifier
from AI.training.dataset_builder import generate_benchmark_dataset

def run_training():
    print("=" * 60)
    print("VoiceShield AI: Training Acoustic Forensic Classifier")
    print("=" * 60)

    print("Generating benchmark training manifolds...")
    X_train, y_train, X_test, y_test = generate_benchmark_dataset(n_samples=1600, seed=42)
    print(f"Training set: {len(X_train)} samples | Evaluation set: {len(X_test)} samples")

    classifier = AcousticForensicClassifier()
    print("Fitting Gradient Boosting Classifier over acoustic feature vectors...")
    classifier.fit(X_train, y_train)

    # Validate training performance
    train_preds = classifier.clf.predict(X_train)
    train_acc = float(np.mean(train_preds == y_train) * 100.0)
    print(f"Train Accuracy: {train_acc:.2f}%")

    model_path = os.path.join(root_dir, "AI", "models", "checkpoint.joblib")
    classifier.save(model_path)
    print(f"[SUCCESS] Model artifact saved to: {model_path}")
    return classifier

if __name__ == "__main__":
    import numpy as np
    run_training()
