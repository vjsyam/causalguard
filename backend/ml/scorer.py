"""
Transaction scorer: Logistic Regression on binary feature indicators.
Threshold is calibrated via cost-weighted sweep on the held-out set.
FP cost: $15 (manual review ops cost)
FN cost: $120 (average fraud transaction loss)
"""
import json
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE
from .pipeline import FEATURE_COLS, LABEL_COL
from .causal_discovery import get_causal_paths, load_dag

FP_COST = 15.0
FN_COST = 120.0

_DIR          = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH    = os.path.join(_DIR, "../artifacts/model.pkl")
SCALER_PATH   = os.path.join(_DIR, "../artifacts/scaler.pkl")
THRESHOLD_PATH = os.path.join(_DIR, "../artifacts/threshold.json")
ARTIFACTS_DIR  = os.path.join(_DIR, "../artifacts")


def train_model(train_df: pd.DataFrame):
    X = train_df[FEATURE_COLS].astype(float).values
    y = train_df[LABEL_COL].astype(int).values

    # SMOTE — use k_neighbors=3 to be safe with small fraud class
    n_fraud = int(y.sum())
    k = min(3, max(1, n_fraud - 1))
    smote = SMOTE(random_state=42, k_neighbors=k)
    X_res, y_res = smote.fit_resample(X, y)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_res)

    clf = LogisticRegression(
        class_weight="balanced",
        max_iter=1000,
        solver="lbfgs",
        random_state=42,
        C=1.0,
    )
    clf.fit(X_scaled, y_res)

    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    joblib.dump(clf, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    print(f"Model saved: {MODEL_PATH}")
    return clf, scaler


def calibrate_threshold(test_df: pd.DataFrame, clf, scaler) -> float:
    X     = scaler.transform(test_df[FEATURE_COLS].astype(float).values)
    y     = test_df[LABEL_COL].astype(int).values
    probs = clf.predict_proba(X)[:, 1]

    best_thresh = 0.5
    best_cost   = float("inf")
    sweep = []
    for thresh in np.arange(0.10, 0.91, 0.05):
        preds = (probs >= thresh).astype(int)
        fp    = int(((preds == 1) & (y == 0)).sum())
        fn    = int(((preds == 0) & (y == 1)).sum())
        tp    = int(((preds == 1) & (y == 1)).sum())
        tn    = int(((preds == 0) & (y == 0)).sum())
        cost  = FP_COST * fp + FN_COST * fn
        prec  = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec   = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        sweep.append({
            "threshold": round(float(thresh), 2),
            "total_cost": round(cost, 2),
            "fp": fp, "fn": fn, "tp": tp, "tn": tn,
            "precision": round(prec, 4),
            "recall":    round(rec, 4),
        })
        if cost < best_cost:
            best_cost   = cost
            best_thresh = float(thresh)

    data = {
        "threshold": round(best_thresh, 2),
        "fp_cost_per_instance": FP_COST,
        "fn_cost_per_instance": FN_COST,
        "optimal_total_cost":   round(best_cost, 2),
        "sweep": sweep,
    }
    with open(THRESHOLD_PATH, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Optimal threshold: {best_thresh:.2f}  (cost: ${best_cost:,.0f})")
    return best_thresh


def load_model():
    clf       = joblib.load(MODEL_PATH)
    scaler    = joblib.load(SCALER_PATH)
    with open(THRESHOLD_PATH) as f:
        td = json.load(f)
    return clf, scaler, td["threshold"]


def score_transaction(row: dict, clf, scaler, threshold: float, dag: dict) -> dict:
    tx_id = str(row.get("transaction_id", "unknown"))
    feats = np.array([[float(row.get(f, 0)) for f in FEATURE_COLS]])
    X_sc  = scaler.transform(feats)
    prob  = float(clf.predict_proba(X_sc)[0, 1])
    flagged = prob >= threshold

    active     = [f for f in FEATURE_COLS if float(row.get(f, 0)) == 1]
    causal_path = get_causal_paths(dag, active) if flagged else []

    return {
        "transaction_id":   tx_id,
        "fraud_score":      round(prob, 4),
        "flagged":          bool(flagged),
        "active_anomalies": active,
        "causal_path":      causal_path,
        "transaction_amt":  float(row.get("transaction_amt", 0.0)),
    }
