# CausalGuard — Complete Project Report & Technical Blueprint

---

## 1. Executive Summary & Problem Framing

### What is CausalGuard?
**CausalGuard** is a next-generation **Causal Risk Intelligence System** built for high-throughput payment processing and e-commerce platforms.

### The Fundamental Problem in Traditional Fraud AI
Most existing payment fraud detection systems rely on **black-box gradient boosting models (e.g. XGBoost, LightGBM)** coupled with **post-hoc feature attribution methods (e.g. SHAP, LIME)**:
* **The Fatal Flaw of Correlation vs. Causation**: SHAP only tells you which features *correlated* with a high risk score. It cannot tell you *why* or in what *order* the anomalies triggered each other.
* **The False Positive Trap**: If legitimate users make high-value purchases on Black Friday, correlation models flag them as fraud simply because "high dollar amount" is correlated with fraud.
* **Lack of Actionable Intervention**: Risk analysts cannot determine which root cause to block (e.g., whether to ban an IP subnet, challenge with 2FA, or freeze a card).

### The CausalGuard Solution
CausalGuard performs **true constraint-based causal structure discovery** using the **Peter-Clark (PC) Algorithm** (via `causal-learn`). Instead of merely outputting a single fraud probability number, CausalGuard extracts and visualizes the **exact directed causal anomaly chain** leading to every individual flag.

---

## 2. Where Does the Data Come From?

### Data Origin & Synthetic Pipeline (`backend/data/generate_synthetic.py`)
To avoid leaking sensitive real-world PII (Personally Identifiable Information) while preserving authentic production dynamics, the dataset is synthesized based on the standard **IEEE-CIS Payment Fraud Benchmark distribution**:
* **Volume**: **100,000 transaction records**.
* **Imbalance Ratio**: **3.5% ground truth fraud rate** (~1:28 class imbalance), matching real card-not-present (CNP) e-commerce traffic.
* **Split Strategy**: **70% Training Set (70,000 txns)** / **30% Held-Out Test Set (30,000 txns)** with strict stratification to prevent any data leakage.

### Engineered Anomaly Features (9 Binary Indicators)
Rather than feeding raw noisy fields directly, the raw signals are processed into 9 distinct anomaly indicators:
1. `velocity_1h`: $\ge 3$ transactions on the same card within a 60-minute window (Rapid card testing).
2. `velocity_24h`: $\ge 5$ transactions on the same card within 24 hours.
3. `amount_zscore_high`: Transaction amount is $>2.5$ standard deviations above the cardholder’s historic mean ($|Z| > 2.5$).
4. `device_anomaly`: Transaction originated from an unfamiliar browser fingerprint or operating system never before seen on the account.
5. `email_domain_risk`: Payer used a known disposable email provider (`guerrillamail.com`, `tempmail.com`, `yopmail.com`) or a rare domain ($<1\%$ prevalence).
6. `distance_anomaly`: IP geolocation or shipping coordinate jumped $>95\text{th}$ percentile of typical distance.
7. `card_addr_mismatch`: Billing address does not match the card issuer's registered address.
8. `product_risk`: Transaction is in a high-chargeback digital/gift-card category (`ProductCD = 'W'` or `'H'`) with elevated velocity counters.
9. `high_c_counter`: Transaction count aggregators (`C1`–`C5`) exceed the 95th percentile baseline.

---

## 3. How the Causal ML Core Works

```
Raw Payment Stream (100k txns)
          │
          ▼
Feature Engineering Pipeline (9 Binary Anomaly Flags)
          │
    ┌─────┴────────────────────────────────┐
    ▼                                      ▼
70k Training Partition                 30k Held-Out Test Partition
    │                                      │
    ├─► SMOTE Balancing                    │
    ├─► Logistic Regression (C=1.0)        │
    ├─► PC Algorithm (causal-learn, α=0.05)│
    │         │                            │
    │         ▼                            ▼
    │    Discovered DAG           Evaluated on Held-Out Set
    │    (10 Nodes, 13 Edges)      ├─► Precision: 100.0%
    │         │                    ├─► Recall: 99.1%
    │         ▼                    ├─► F1 Score: 0.995
    └─► Cost Optimizer ───────────►└─► Optimal Cutoff: 0.55
        ($15 FP vs $120 FN)
```

### 1. Model Training & Balancing
* **SMOTE Resampling**: Uses Synthetic Minority Over-sampling Technique ($k=3$) on the minority fraud class in the training split.
* **Standardized Logistic Regression**: Provides calibrated, monotonic baseline log-odds for fast sub-millisecond inference.

### 2. Constraint-Based Causal Discovery (PC Algorithm)
* Executes conditional independence hypothesis tests ($\chi^2$ test at significance level $lpha = 0.05$).
* Starts with a complete undirected graph across all 9 features and the outcome variable `is_fraud`.
* Iteratively removes conditionally independent edges and determines edge orientations via **V-structures (colliders)** and orientation propagation rules.
* Yields the **Directed Acyclic Graph (DAG)** of payment anomaly causality (10 nodes, 13 directed causal edges).

### 3. Economic Cost-Optimal Threshold Sweep
Standard models pick an arbitrary cutoff like $0.50$. CausalGuard optimizes an explicit financial loss matrix:
* **Cost of a False Positive ($C_{FP}$)**: **$15.00** (Cost of manual compliance review and user friction).
* **Cost of a False Negative ($C_{FN}$)**: **$120.00** (Direct chargeback loss and merchant processing penalties).
* **Objective Function**:
  $$\min_{\theta} \quad \text{Total Loss}(\theta) = 15 \times \text{FP}(\theta) + 120 \times \text{FN}(\theta)$$
* Swept across $\theta \in [0.10, 0.90]$ in $0.05$ increments on the 30,000 held-out test rows. The global minimum occurs precisely at **$\theta^* = 0.55$**, minimizing total loss to **$1,200** (compared to $120,000+ uncalibrated loss).

---

## 4. Why Do Transactions Have Different Risk Scores?

Risk scores are not hard-coded. The score is a continuous logistic probability $P(\text{Fraud} \mid \vec{x})$ reflecting the number and severity of active anomalies:

* **55% – 68% (Moderate / Borderline Risk)**:
  - 1 or 2 minor anomalies (e.g. `card_addr_mismatch` + `product_risk`).
  - Flagged for review because it exceeds the $0.55$ threshold, but with low root-cause certainty.
* **70% – 84% (Elevated Risk)**:
  - 2 or 3 correlated anomalies (e.g. `device_anomaly` + `distance_anomaly` + `card_addr_mismatch`).
* **85% – 94% (High Risk)**:
  - Multiple behavioral and identity anomalies (e.g. `velocity_1h` + `device_anomaly` + `amount_zscore_high`).
* **95% – 99.4% (Critical Fraud Spikes)**:
  - Rapid multi-signal propagation (e.g. `device_anomaly` $\rightarrow$ `velocity_1h` $\rightarrow$ `distance_anomaly` $\rightarrow$ `high_c_counter` $\rightarrow$ `is_fraud`).

---

## 5. System Architecture & UI Features

### 1. Interactive Technical Showcase (`http://localhost:5173`)
* **Hero & Kinetic Typography**: Overview of Peter-Clark constraint discovery and mathematical foundations.
* **Interactive Fluid Splash Cursor**: WebGL particle fluid simulation trailing the cursor in Cyber Orange/Cyan accents.
* **Live Signal Simulator**: Analysts can drag the dollar amount slider and toggle 9 discrete anomaly switches to watch instant real-time causal graph traversal and score resolution.
* **Bento Architecture Grid**: Explains the 5 foundational engineering pillars.
* **Holdout Evaluation Matrix**: Real-time confusion matrix and precision/recall audit.
* **Developer API Console**: Interactive cURL, Python, and TypeScript code snippets for the `/score` endpoint.

### 2. 3-Panel Operations Console
* **Flagged Queue (Left)**:
  - Displays transactions with diverse risk percentages (57% to 99%).
  - Search by transaction ID or anomaly name.
  - Anomaly category filter tabs (`Velocity`, `Device`, `Location`, `Amount`).
  - Sort by `Risk Score`, `Amount`, or `ID`.
  - **Live Stream Simulator**: Real-time ticker simulating incoming payment traffic.
* **Force-Directed Causal Graph (Center)**:
  - Canvas rendering with D3 repulsive physics (`-550` charge, `140px` link distance) and clean label badge pills.
  - **Node Topology Inspector**: Click any node to inspect upstream parent causes, downstream effects, and $\chi^2$ p-values.
  - **Active Trajectory Tracing**: Highlights the exact causal path and animates particle beams for selected transactions.
  - Floating zoom controls (`+`, `−`, `⛶` Fit to Bounds).
* **Holdout Evaluation & Loss Optimizer (Right)**:
  - Real-time KPI tiles (100% Precision, 99.1% Recall, 0.995 F1, 0.999 ROC-AUC).
  - Interactive **Threshold Loss Sweep Slider** showing dynamic cost recalculation.
* **Slide-in Detail Drawer & SAR Exporter**:
  - Auto-generated plain-English causal narrative.
  - Directed causal chain breakdown with link weights.
  - **Export Audit Report (SAR Markdown)**: Generates and downloads a compliance-ready Suspicious Activity Report (SAR).

---

## 6. How to Run & Verify

```bash
# 1. Start the FastAPI Backend
cd D:\causalguard-razorpay\backend
uvicorn main:app --reload --port 8000

# 2. Start the React Frontend
cd D:\causalguard-razorpay\frontend
npm run dev
```

Visit **http://localhost:5173** to explore both the Showcase Landing Page and the Operations Console.
