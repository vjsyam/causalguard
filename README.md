# CausalGuard: Explainable Causal-Chain Fraud Risk Intelligence

> **Autonomous Causal Spike Detector & Root Cause Reasoner**
> One class of loss: **Payment card & transaction fraud spikes**

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Causal-Learn](https://img.shields.io/badge/causal--learn-PC%20Algorithm-8B5CF6?style=flat-square)](https://causal-learn.readthedocs.io)

---

## What Makes This Different

Every conventional fraud detector outputs **that** a transaction is suspicious. CausalGuard outputs **why** — as an auditable, mathematically verified causal chain, not just a feature importance ranking.

The core differentiator: we execute the **PC algorithm** (constraint-based causal structure discovery from `causal-learn`) over 9 binary anomaly indicators. The resulting directed acyclic graph (DAG) forms the structural backbone of every explanation. When a transaction is flagged, we trace its active anomaly nodes through the DAG directly to `is_fraud` and render that subgraph as an interactive causal explanation.

```
device_anomaly ────────────────────────→ velocity_1h ───────→ is_fraud
     │                                                          ▲
     └────────→ distance_anomaly ──────→ card_addr_mismatch ────┤
                                                                │
amount_zscore_high ─────────────────────────────────────────────┘
```

---

## Metrics (Held-Out Test Set — 30,000 Unseen Transactions)

> ⚠️ These metrics are computed **strictly** on the held-out test set (30% stratified split). Never on training data.

| Metric | Measured Value | Benchmark Description |
|---|---|---|
| **Precision** | **1.000 (100%)** | Zero false positives on held-out test set |
| **Recall** | **0.9905 (99.1%)** | Catches 1,040 out of 1,050 actual fraud spikes |
| **F1 Score** | **0.9952** | Harmonic mean on imbalanced distribution |
| **ROC-AUC** | **0.9988** | Discriminative separation across all cutoffs |
| **Dataset Fraud Rate** | **3.50%** | Natural real-world class imbalance (~1:28) |
| **Optimal Threshold** | **0.55** | Cost-weighted objective ($15 FP vs $120 FN) |
| **Held-Out Test Set** | **30,000 rows** | Stratified split from 100,000 base records |

---

## Feature Data Dictionary

| Feature Indicator | Source Fields | Encoding | Description |
|---|---|---|---|
| `velocity_1h` | `TransactionDT`, `card1` | Binary (0/1) | Card generated >2 transactions within a 60-minute window |
| `velocity_24h` | `TransactionDT`, `card1` | Binary (0/1) | Card generated >10 transactions within a 24-hour rolling window |
| `amount_zscore_high`| `TransactionAmt`, `card1`| Binary (0/1) | Transaction amount exceeds 2.5 standard deviations from card baseline |
| `device_anomaly` | `DeviceType`, `card1` | Binary (0/1) | Browser / Device ID differs from cardholder's primary profile |
| `email_domain_risk` | `P_emaildomain` | Binary (0/1) | Disposable email or rare domain (<1% overall population frequency) |
| `distance_anomaly` | `dist1` | Binary (0/1) | Geographic distance jump exceeds the 95th percentile threshold |
| `card_addr_mismatch`| `addr1`, `card1` | Binary (0/1) | Billing zip/location differs from card primary billing address |
| `product_risk` | `ProductCD`, `C1` | Binary (0/1) | High-risk digital goods category with elevated transaction counter |
| `high_c_counter` | `C1`–`C5` | Binary (0/1) | Any consecutive velocity counter exceeds its 95th percentile |
| `is_fraud` | `isFraud` | Target (0/1) | Ground truth fraud label |

---

## Quickstart

### 1. Run Pipeline & Train Model
```bash
cd backend
python train.py
```

### 2. Start FastAPI Server
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### 3. Launch Frontend Console
```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:5173** to explore the interactive dashboard and causal sandbox.
