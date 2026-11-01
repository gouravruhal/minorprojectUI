"""
AI Voice Detection Model: Multi-Resolution Acoustic Ensemble Classifier.
Supports dual-head evaluation for 19-dim segments and 28-dim 10-30s temporal recordings.
"""
import os
import joblib
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier, ExtraTreesClassifier

class AcousticForensicClassifier:
    """Production Dual-Head Ensemble Classifier fusing ML decision trees with glottal biomechanics."""

    def __init__(self):
        # Head 1: Segment & 5-Second Interval Classifier (19 dimensions)
        self.seg_gb = GradientBoostingClassifier(n_estimators=100, learning_rate=0.08, max_depth=4, random_state=42)
        self.seg_et = ExtraTreesClassifier(n_estimators=80, max_depth=6, random_state=42)
        # Head 2: Global 10-30s Temporal Dynamics Classifier (28 dimensions)
        self.temp_gb = GradientBoostingClassifier(n_estimators=120, learning_rate=0.07, max_depth=5, random_state=42)
        self.temp_et = ExtraTreesClassifier(n_estimators=100, max_depth=7, random_state=42)
        self.is_fitted = False

    def fit_dual(self, X_seg: np.ndarray, y_seg: np.ndarray, X_temp: np.ndarray, y_temp: np.ndarray):
        """Trains both segment (19-dim) and temporal (28-dim) heads."""
        self.seg_gb.fit(X_seg, y_seg)
        self.seg_et.fit(X_seg, y_seg)
        self.temp_gb.fit(X_temp, y_temp)
        self.temp_et.fit(X_temp, y_temp)
        self.is_fitted = True
        return self

    def fit(self, X: np.ndarray, y: np.ndarray):
        """Single-head fitting for backwards compatibility."""
        if X.shape[1] > 20:
            self.temp_gb.fit(X, y)
            self.temp_et.fit(X, y)
        else:
            self.seg_gb.fit(X, y)
            self.seg_et.fit(X, y)
        self.is_fitted = True
        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Computes ensemble probabilities [P(Human), P(Synthetic)]."""
        if not self.is_fitted:
            return self._heuristic_proba(X)
        if X.shape[1] > 20:
            p_gb = self.temp_gb.predict_proba(X)
            p_et = self.temp_et.predict_proba(X)
        else:
            p_gb = self.seg_gb.predict_proba(X)
            p_et = self.seg_et.predict_proba(X)
        return 0.60 * p_gb + 0.40 * p_et

    def predict_synthetic_score(self, feature_vector: np.ndarray) -> float:
        """Calculates calibrated synthetic probability (0-100%) fused with vocal tract physics."""
        f = feature_vector
        is_long = len(f) > 20
        jitter = float(f[2]) if is_long else float(f[1])
        shimmer = float(f[5]) if is_long else float(f[2])
        hnr = float(f[7]) if is_long else float(f[3])
        hf_ratio = float(f[11]) if is_long else float(f[6])

        if self.is_fitted:
            vec = f.reshape(1, -1)
            prob_ml = float(self.predict_proba(vec)[0][1]) * 100.0
        else:
            prob_ml = 50.0

        # Physical vocal fold biomechanics adjustments (soft calibration without negative penalization)
        adj = 0.0
        if jitter < 0.25:
            adj += 20.0
        if shimmer < 0.90:
            adj += 15.0
        if hnr > 27.0:
            adj += 12.0
        if hf_ratio > 0.26:
            adj += 15.0

        # Weighted combination: 85% ML Ensemble probability + 15% physical consistency bounds
        score = 0.85 * prob_ml + 0.15 * (50.0 + adj)
        return float(np.clip(score, 4.0, 96.0))

    def _heuristic_proba(self, X: np.ndarray) -> np.ndarray:
        probas = []
        for row in X:
            j = row[2] if len(row) >= 28 else row[1]
            s = row[5] if len(row) >= 28 else row[2]
            p_synth = 0.88 if (j < 0.3 or s < 1.0) else 0.12
            probas.append([1.0 - p_synth, p_synth])
        return np.array(probas)

    def save(self, filepath: str):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump({
            "seg_gb": self.seg_gb, "seg_et": self.seg_et,
            "temp_gb": self.temp_gb, "temp_et": self.temp_et,
            "is_fitted": self.is_fitted
        }, filepath)

    def load(self, filepath: str):
        data = joblib.load(filepath)
        self.seg_gb = data.get("seg_gb", data.get("gb_clf"))
        self.seg_et = data.get("seg_et", data.get("et_clf"))
        self.temp_gb = data.get("temp_gb", data.get("gb_clf"))
        self.temp_et = data.get("temp_et", data.get("et_clf"))
        self.is_fitted = data.get("is_fitted", True)
        return self
