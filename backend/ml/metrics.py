"""
Metrics computation on the held-out test set.
NEVER called on training data or cherry-picked examples.
"""
import json
import os
import numpy as np
import pandas as pd
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    confusion_matrix, roc_auc_score
)
from .pipeline import FEATURE_COLS, LABEL_COL
from .scorer import FP_COST, FN_COST

_DIR         = os.path.dirname(os.path.abspath(__file__))
METRICS_PATH = os.path.join(_DIR, "../artifacts/metrics.json")
THRESH_PATH  = os.path.join(_DIR, "../artifacts/threshold.json")


def compute_and_save_metrics(test_df: pd.DataFrame, clf, scaler, threshold: float) -> dict:
    X     = scaler.transform(test_df[FEATURE_COLS].astype(float).values)
    y     = test_df[LABEL_COL].astype(int).values
    probs = clf.predict_proba(X)[:, 1]
    preds = (probs >= threshold).astype(int)

    cm = confusion_matrix(y, preds)
    tn, fp, fn, tp = cm.ravel()

    precision = float(precision_score(y, preds, zero_division=0))
    recall    = float(recall_score(y, preds, zero_division=0))
    f1        = float(f1_score(y, preds, zero_division=0))
    fpr       = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    auc       = float(roc_auc_score(y, probs)) if len(np.unique(y)) > 1 else 0.0

    total_fp_cost = fp * FP_COST
    total_fn_cost = fn * FN_COST
    total_cost    = total_fp_cost + total_fn_cost

    n_total    = len(y)
    n_fraud    = int(y.sum())
    n_legit    = n_total - n_fraud
    fraud_rate = n_fraud / n_total

    sweep = []
    if os.path.exists(THRESH_PATH):
        with open(THRESH_PATH) as f:
            sweep = json.load(f).get("sweep", [])

    metrics = {
        "dataset_note":           "Computed ONLY on held-out test set (30% stratified split). Never on training data.",
        "held_out_set_size":      n_total,
        "fraud_count":            n_fraud,
        "legit_count":            n_legit,
        "fraud_rate_pct":         round(fraud_rate * 100, 2),
        "class_imbalance_ratio":  f"1:{round(n_legit / n_fraud, 1)}" if n_fraud > 0 else "N/A",
        "threshold_used":         round(threshold, 2),
        "fp_cost_assumption":     f"${FP_COST} per false positive (manual review)",
        "fn_cost_assumption":     f"${FN_COST} per false negative (missed fraud)",
        "precision":              round(precision, 4),
        "recall":                 round(recall, 4),
        "f1_score":               round(f1, 4),
        "false_positive_rate":    round(fpr, 4),
        "roc_auc":                round(auc, 4),
        "confusion_matrix":       {"tp": int(tp), "fp": int(fp), "tn": int(tn), "fn": int(fn)},
        "cost_analysis": {
            "total_false_positive_cost": round(total_fp_cost, 2),
            "total_false_negative_cost": round(total_fn_cost, 2),
            "total_cost_at_threshold":   round(total_cost, 2),
        },
        "threshold_sweep": sweep,
    }

    os.makedirs(os.path.dirname(METRICS_PATH), exist_ok=True)
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"Metrics saved: {METRICS_PATH}")
    print(f"  Precision: {precision:.4f} | Recall: {recall:.4f} | F1: {f1:.4f}")
    print(f"  FPR: {fpr:.4f} | AUC: {auc:.4f} | Cost: ${total_cost:,.0f}")
    return metrics


def load_metrics() -> dict:
    if not os.path.exists(METRICS_PATH):
        raise FileNotFoundError(f"Metrics not found at {METRICS_PATH}. Run train.py first.")
    with open(METRICS_PATH) as f:
        return json.load(f)
