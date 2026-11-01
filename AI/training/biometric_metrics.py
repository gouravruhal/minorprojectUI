"""
Biometric Forensic Evaluation Metrics for Anti-Spoofing Systems.
Calculates Equal Error Rate (EER), Minimum Tandem Detection Cost Function (min-tDCF),
and ROC-AUC according to ASVspoof challenge specifications.
"""
from typing import Tuple, Dict, Any
import numpy as np

def compute_eer(bonafide_scores: np.ndarray, spoof_scores: np.ndarray) -> Tuple[float, float]:
    """
    Computes Equal Error Rate (EER) and operating threshold where FAR == FRR.
    Scores represent spoof probability (higher score = more synthetic).
    """
    if len(bonafide_scores) == 0 or len(spoof_scores) == 0:
        return 0.0, 0.50

    # Sort all unique score thresholds
    all_scores = np.concatenate([bonafide_scores, spoof_scores])
    thresholds = np.sort(np.unique(all_scores))

    # Vectorized computation of FRR (bona fide >= threshold) and FAR (spoof < threshold)
    n_bonafide = len(bonafide_scores)
    n_spoof = len(spoof_scores)

    # Searchsorted for fast CDF evaluation
    b_sorted = np.sort(bonafide_scores)
    s_sorted = np.sort(spoof_scores)

    # frr: bona fide rejected (score >= thresh) -> count of b >= thresh
    frr = (n_bonafide - np.searchsorted(b_sorted, thresholds, side="left")) / float(n_bonafide)
    # far: spoof accepted (score < thresh) -> count of s < thresh
    far = np.searchsorted(s_sorted, thresholds, side="left") / float(n_spoof)

    # Find intersection index where |FAR - FRR| is minimized
    diff = far - frr
    idx = np.argmin(np.abs(diff))

    # Linear interpolation for sub-threshold precision
    if idx > 0 and idx < len(thresholds) - 1:
        eer = float((far[idx] + frr[idx]) / 2.0)
    else:
        eer = float(far[idx])

    opt_threshold = float(thresholds[idx])
    return round(eer * 100.0, 3), round(opt_threshold, 4)

def compute_min_tdcf(
    bonafide_scores: np.ndarray,
    spoof_scores: np.ndarray,
    p_target: float = 0.05,
    p_spoof: float = 0.05,
    c_miss: float = 1.0,
    c_fa: float = 10.0
) -> float:
    """
    Computes normalized minimum tandem Detection Cost Function (min-tDCF)
    as standardized in ASVspoof 2019/2021 evaluations.
    """
    if len(bonafide_scores) == 0 or len(spoof_scores) == 0:
        return 0.0

    p_nontarget = 1.0 - p_target - p_spoof
    c_0 = min(c_miss * p_target, c_fa * p_nontarget)
    c_1 = c_miss * p_target
    c_2 = c_fa * p_spoof

    all_scores = np.sort(np.unique(np.concatenate([bonafide_scores, spoof_scores])))
    b_sorted = np.sort(bonafide_scores)
    s_sorted = np.sort(spoof_scores)

    n_bonafide = len(bonafide_scores)
    n_spoof = len(spoof_scores)

    p_miss = (n_bonafide - np.searchsorted(b_sorted, all_scores, side="left")) / float(n_bonafide)
    p_fa = np.searchsorted(s_sorted, all_scores, side="left") / float(n_spoof)

    tdcf = (c_1 * p_miss + c_2 * p_fa) / (c_0 + 1e-9)
    min_tdcf = float(np.min(tdcf))
    return round(min_tdcf, 4)

def compute_roc_auc(bonafide_scores: np.ndarray, spoof_scores: np.ndarray) -> float:
    """Computes Area Under the Receiver Operating Characteristic curve (ROC-AUC)."""
    y_true = np.concatenate([np.zeros(len(bonafide_scores)), np.ones(len(spoof_scores))])
    y_scores = np.concatenate([bonafide_scores, spoof_scores])
    # Mann-Whitney U rank statistic for exact AUC calculation
    ranks = np.argsort(np.argsort(y_scores)) + 1
    n_pos = len(spoof_scores)
    n_neg = len(bonafide_scores)
    if n_pos == 0 or n_neg == 0:
        return 0.50
    u_stat = np.sum(ranks[y_true == 1]) - (n_pos * (n_pos + 1)) / 2.0
    auc = float(u_stat / (n_pos * n_neg))
    return round(auc, 4)

def evaluate_forensic_metrics(bonafide_scores: np.ndarray, spoof_scores: np.ndarray) -> Dict[str, Any]:
    """Evaluates full ASVspoof forensic biometric suite."""
    eer_pct, threshold = compute_eer(bonafide_scores, spoof_scores)
    min_tdcf = compute_min_tdcf(bonafide_scores, spoof_scores)
    auc = compute_roc_auc(bonafide_scores, spoof_scores)

    return {
        "eer_percent": eer_pct,
        "optimal_threshold": threshold,
        "min_tdcf": min_tdcf,
        "roc_auc": auc,
        "n_bonafide": len(bonafide_scores),
        "n_spoof": len(spoof_scores)
    }

