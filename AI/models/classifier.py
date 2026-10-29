"""
AI Voice Detection Model: Acoustic Forensic Classifier.
Combines trained ensemble machine learning with physical vocal biomechanics.
"""
import os
import joblib
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier

class AcousticForensicClassifier:
    """
    Forensic voice authenticity classifier.
    Combines statistical gradient-boosted trees over LFCC features with
    physiological vocal fold perturbation rules (glottal jitter and shimmer).
    """

    def __init__(self):
        self.clf = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=4,
            random_state=42
        )
        self.is_fitted = False

    def fit(self, X: np.ndarray, y: np.ndarray):
        """Train the classifier on extracted feature matrices."""
        self.clf.fit(X, y)
        self.is_fitted = True
        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Predict class probabilities: [P(Human), P(Synthetic)]."""
        if not self.is_fitted:
            # Fallback heuristic prior if model weights not yet trained
            return self._heuristic_proba(X)
        return self.clf.predict_proba(X)

    def predict_synthetic_score(self, feature_vector: np.ndarray) -> float:
        """
        Calculates a calibrated synthetic probability score (0 to 100%)
        combining model prediction with glottal biomechanical physics.
        """
        f = feature_vector
        # Features: [0: f0, 1: jitter, 2: shimmer, 3: hnr, 4: centroid, 5: rolloff, 6: hf_ratio, 7+: lfcc]
        jitter = float(f[1])
        shimmer = float(f[2])
        hnr = float(f[3])
        hf_ratio = float(f[6])

        # 1. Base ML model probability
        if self.is_fitted:
            prob_ml = float(self.clf.predict_proba(f.reshape(1, -1))[0][1]) * 100.0
        else:
            prob_ml = 50.0

        # 2. Physics-based vocal fold perturbation adjustment
        physics_adjustment = 0.0
        if jitter < 0.25:
            physics_adjustment += 25.0
        elif jitter > 0.50 and jitter < 2.0:
            physics_adjustment -= 20.0

        if shimmer < 0.90:
            physics_adjustment += 20.0
        elif shimmer > 1.5 and shimmer < 4.5:
            physics_adjustment -= 15.0

        if hnr > 28.0:
            physics_adjustment += 10.0

        if hf_ratio > 0.28:
            physics_adjustment += 15.0

        # Weighted combination: 60% ML tree, 40% Glottal physics
        final_score = 0.60 * prob_ml + 0.40 * (50.0 + physics_adjustment)
        return float(np.clip(final_score, 4.0, 96.0))

    def _heuristic_proba(self, X: np.ndarray) -> np.ndarray:
        probas = []
        for row in X:
            jitter, shimmer = row[1], row[2]
            p_synth = 0.85 if (jitter < 0.3 or shimmer < 1.0) else 0.15
            probas.append([1.0 - p_synth, p_synth])
        return np.array(probas)

    def save(self, filepath: str):
        """Persist model checkpoint to disk."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump({"clf": self.clf, "is_fitted": self.is_fitted}, filepath)

    def load(self, filepath: str):
        """Load model checkpoint from disk."""
        data = joblib.load(filepath)
        self.clf = data["clf"]
        self.is_fitted = data["is_fitted"]
        return self
