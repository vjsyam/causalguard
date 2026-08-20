import pandas as pd
import numpy as np
import os
import warnings
warnings.filterwarnings("ignore")

DISPOSABLE_DOMAINS = {
    "mailnull.com", "guerrillamail.com", "throwam.com", "yopmail.com",
    "tempmail.com", "sharklasers.com", "spam4.me", "trashmail.com",
    "maildrop.cc", "dispostable.com"
}
HIGH_RISK_PRODUCTS = {"W", "H"}

FEATURE_COLS = [
    "velocity_1h", "velocity_24h", "amount_zscore_high",
    "device_anomaly", "email_domain_risk", "distance_anomaly",
    "card_addr_mismatch", "product_risk", "high_c_counter"
]
LABEL_COL = "is_fraud"

DATA_DICTIONARY = {
    "velocity_1h":        "Card made >2 transactions within a 1-hour window (binary)",
    "velocity_24h":       "Card made >10 transactions within a 24-hour window (binary)",
    "amount_zscore_high": "TransactionAmt z-score >2.5 vs card historical mean (binary)",
    "device_anomaly":     "DeviceType differs from card's most common device (binary)",
    "email_domain_risk":  "P_emaildomain is disposable or very rare domain (binary)",
    "distance_anomaly":   "dist1 exceeds 95th percentile of all dist1 values (binary)",
    "card_addr_mismatch": "addr1 differs from card's most common billing address (binary)",
    "product_risk":       "ProductCD in high-risk set {W,H} AND C1 above median (binary)",
    "high_c_counter":     "Any C1-C5 counter field exceeds its 95th percentile (binary)",
    "is_fraud":           "Target label: 1=fraud, 0=legitimate (from isFraud column)",
}


def load_raw_data(tx_path: str, identity_path: str = None) -> pd.DataFrame:
    df = pd.read_csv(tx_path)
    if identity_path and os.path.exists(identity_path):
        ident = pd.read_csv(identity_path)
        df = df.merge(ident, on="TransactionID", how="left")
    return df


def _mode_safe(s):
    m = s.mode()
    return m.iloc[0] if len(m) > 0 else None


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    out = pd.DataFrame()
    out["transaction_id"] = df["TransactionID"].astype(str)
    out["transaction_amt"] = df["TransactionAmt"].astype(float)

    # ── 1. Velocity ──────────────────────────────────────────────────────
    dt_arr = df["TransactionDT"].values.astype(float)
    card_arr = df["card1"].values

    vel_1h = np.zeros(len(df), dtype=int)
    vel_24h = np.zeros(len(df), dtype=int)

    # Vectorised: use broadcasting on smaller chunks to avoid OOM on large datasets
    CHUNK = 5000
    n = len(df)
    for start in range(0, n, CHUNK):
        end = min(start + CHUNK, n)
        dt_chunk = dt_arr[start:end, None]          # (chunk, 1)
        dt_all   = dt_arr[None, :]                   # (1, n)
        card_chunk = card_arr[start:end, None]
        card_all   = card_arr[None, :]
        same_card = card_chunk == card_all
        diff = np.abs(dt_chunk - dt_all)
        vel_1h[start:end]  = np.maximum(0, (same_card & (diff <= 3600)).sum(axis=1) - 1)
        vel_24h[start:end] = np.maximum(0, (same_card & (diff <= 86400)).sum(axis=1) - 1)

    out["velocity_1h"]  = (vel_1h > 2).astype(int)
    out["velocity_24h"] = (vel_24h > 10).astype(int)

    # ── 2. Amount z-score ────────────────────────────────────────────────
    card_stats = df.groupby("card1")["TransactionAmt"].agg(["mean", "std"]).reset_index()
    card_stats.columns = ["card1", "amt_mean", "amt_std"]
    df2 = df.merge(card_stats, on="card1", how="left")
    df2["amt_std"] = df2["amt_std"].fillna(1.0).replace(0, 1.0)
    z = (df2["TransactionAmt"] - df2["amt_mean"]) / df2["amt_std"]
    out["amount_zscore_high"] = (z.abs() > 2.5).astype(int)

    # ── 3. Device anomaly ────────────────────────────────────────────────
    if "DeviceType" in df.columns:
        usual_dev = df.groupby("card1")["DeviceType"].agg(_mode_safe).reset_index()
        usual_dev.columns = ["card1", "usual_device"]
        df3 = df.merge(usual_dev, on="card1", how="left")
        df3["usual_device"] = df3["usual_device"].fillna("unknown")
        df3["DeviceType"] = df3["DeviceType"].fillna("unknown")
        out["device_anomaly"] = (df3["DeviceType"] != df3["usual_device"]).astype(int)
    else:
        out["device_anomaly"] = 0

    # ── 4. Email domain risk ─────────────────────────────────────────────
    if "P_emaildomain" in df.columns:
        emails = df["P_emaildomain"].fillna("").astype(str)
        freq   = emails.value_counts(normalize=True)
        rare   = set(freq[freq < 0.01].index)
        out["email_domain_risk"] = (
            emails.isin(DISPOSABLE_DOMAINS) | emails.isin(rare)
        ).astype(int)
    else:
        out["email_domain_risk"] = 0

    # ── 5. Distance anomaly ──────────────────────────────────────────────
    if "dist1" in df.columns:
        d1  = df["dist1"].fillna(0).astype(float)
        p95 = d1.quantile(0.95)
        out["distance_anomaly"] = (d1 > p95).astype(int)
    else:
        out["distance_anomaly"] = 0

    # ── 6. Card/address mismatch ─────────────────────────────────────────
    if "addr1" in df.columns:
        usual_addr = df.groupby("card1")["addr1"].agg(_mode_safe).reset_index()
        usual_addr.columns = ["card1", "usual_addr"]
        df4 = df.merge(usual_addr, on="card1", how="left")
        out["card_addr_mismatch"] = (df4["addr1"] != df4["usual_addr"]).astype(int)
    else:
        out["card_addr_mismatch"] = 0

    # ── 7. Product risk ──────────────────────────────────────────────────
    if "ProductCD" in df.columns and "C1" in df.columns:
        c1_med = df["C1"].median()
        out["product_risk"] = (
            df["ProductCD"].isin(HIGH_RISK_PRODUCTS) & (df["C1"] > c1_med)
        ).astype(int)
    else:
        out["product_risk"] = 0

    # ── 8. High C-counter ────────────────────────────────────────────────
    c_cols = [c for c in ["C1","C2","C3","C4","C5"] if c in df.columns]
    if c_cols:
        p95v = df[c_cols].quantile(0.95)
        out["high_c_counter"] = (df[c_cols] > p95v).any(axis=1).astype(int)
    else:
        out["high_c_counter"] = 0

    # ── Label ────────────────────────────────────────────────────────────
    out[LABEL_COL] = df["isFraud"].astype(int)

    return out
