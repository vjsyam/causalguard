"""
CausalGuard training pipeline — run once before starting the API.

Usage:
  cd D:/causalguard-razorpay/backend
  python train.py

Steps:
  1. Generate synthetic data (or use real IEEE-CIS CSVs)
  2. Engineer 9 binary anomaly features
  3. 70/30 stratified train/test split
  4. Train Logistic Regression with SMOTE
  5. Run PC algorithm for causal discovery
  6. Calibrate cost-weighted threshold
  7. Compute and save metrics on held-out test set
  8. Persist all scored test transactions to SQLite
"""
import sys
import os
import json
import warnings
warnings.filterwarnings("ignore")

# Allow imports from backend root
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pandas as pd
from sklearn.model_selection import train_test_split

from data.generate_synthetic import generate_and_save
from ml.pipeline import load_raw_data, engineer_features, FEATURE_COLS, LABEL_COL
from ml.causal_discovery import run_pc_algorithm
from ml.scorer import train_model, calibrate_threshold, score_transaction, load_model
from ml.metrics import compute_and_save_metrics
from db.database import engine, Base, SessionLocal
from db.models import Transaction

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
DATA_DIR      = os.path.join(os.path.dirname(__file__), "data")


def main():
    print("=" * 60)
    print("CausalGuard Training Pipeline")
    print("=" * 60)

    # ── Step 1: Data ──────────────────────────────────────────────
    tx_path = os.path.join(DATA_DIR, "train_transaction.csv")
    if not os.path.exists(tx_path):
        print("\nStep 1: Generating synthetic data...")
        tx_path = generate_and_save(DATA_DIR)
    else:
        print(f"\nStep 1: Using existing data at {tx_path}")

    print("\nStep 2: Engineering features...")
    raw = load_raw_data(tx_path)
    print(f"  Raw shape: {raw.shape}")
    eng = engineer_features(raw)
    print(f"  Engineered shape: {eng.shape}")

    fraud_rate = eng[LABEL_COL].mean()
    print(f"  Fraud rate: {fraud_rate*100:.2f}%  (imbalance ~1:{round((1-fraud_rate)/fraud_rate)})")

    # ── Step 3: Split ─────────────────────────────────────────────
    print("\nStep 3: 70/30 stratified train/test split...")
    train_df, test_df = train_test_split(
        eng, test_size=0.30, stratify=eng[LABEL_COL], random_state=42
    )
    print(f"  Train: {len(train_df):,} | Test: {len(test_df):,}")
    print(f"  Train fraud: {train_df[LABEL_COL].sum():,} | Test fraud: {test_df[LABEL_COL].sum():,}")

    # ── Step 4: Train model ───────────────────────────────────────
    print("\nStep 4: Training Logistic Regression with SMOTE...")
    clf, scaler = train_model(train_df)

    # ── Step 5: Causal discovery ──────────────────────────────────
    print("\nStep 5: PC algorithm causal discovery...")
    # Use a sample for speed (PC is O(n^2) in features, O(n) in samples)
    sample_size = min(10000, len(train_df))
    dag = run_pc_algorithm(
        train_df.sample(sample_size, random_state=42),
        FEATURE_COLS,
        alpha=0.05,
        artifacts_dir=ARTIFACTS_DIR,
    )
    print(f"  DAG: {len(dag['nodes'])} nodes, {len(dag['edges'])} edges")

    # ── Step 6: Calibrate threshold ───────────────────────────────
    print("\nStep 6: Cost-weighted threshold calibration (FP=$15, FN=$120)...")
    threshold = calibrate_threshold(test_df, clf, scaler)

    # ── Step 7: Metrics on held-out set ──────────────────────────
    print("\nStep 7: Computing metrics on held-out test set...")
    metrics = compute_and_save_metrics(test_df, clf, scaler, threshold)

    # ── Step 8: Persist scored transactions to DB ─────────────────
    print("\nStep 8: Persisting scored test transactions to SQLite...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Score all test transactions for the dashboard
    from ml.causal_discovery import load_dag
    dag = load_dag(ARTIFACTS_DIR)
    db.query(Transaction).delete()

    batch = []
    for _, row in test_df.iterrows():
        row_dict = row.to_dict()
        result = score_transaction(row_dict, clf, scaler, threshold, dag)
        import json as _json
        tx = Transaction(
            transaction_id=str(row_dict["transaction_id"]),
            transaction_amt=float(row_dict.get("transaction_amt", 0)),
            **{f: int(row_dict.get(f, 0)) for f in FEATURE_COLS},
            is_fraud=int(row_dict[LABEL_COL]),
            fraud_score=result["fraud_score"],
            flagged=result["flagged"],
            active_anomalies_json=_json.dumps(result["active_anomalies"]),
            causal_path_json=_json.dumps(result["causal_path"]),
        )
        batch.append(tx)
        if len(batch) >= 500:
            db.bulk_save_objects(batch)
            db.commit()
            batch = []
            print(f"  {db.query(Transaction).count():,} rows persisted...", end="\r")

    if batch:
        db.bulk_save_objects(batch)
        db.commit()

    total = db.query(Transaction).count()
    flagged = db.query(Transaction).filter(Transaction.flagged == True).count()
    db.close()
    print(f"\n  Total persisted: {total:,} | Flagged: {flagged:,}")

    print("\n" + "=" * 60)
    print("Training complete!")
    print(f"  Precision: {metrics['precision']:.4f}")
    print(f"  Recall:    {metrics['recall']:.4f}")
    print(f"  F1:        {metrics['f1_score']:.4f}")
    print(f"  Threshold: {metrics['threshold_used']}")
    print("\nNext: uvicorn main:app --reload --port 8000")
    print("=" * 60)


if __name__ == "__main__":
    main()
