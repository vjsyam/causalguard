import { SimulatedFeatureState, TransactionScore, CausalEdge } from "../types";

export const DEFAULT_SIMULATION_STATE: SimulatedFeatureState = {
  velocity_1h: true,
  velocity_24h: false,
  amount_zscore_high: true,
  device_anomaly: true,
  email_domain_risk: false,
  distance_anomaly: false,
  card_addr_mismatch: false,
  product_risk: false,
  high_c_counter: false,
  transaction_amt: 349.50,
};

export const CAUSAL_GRAPH_DEF = {
  nodes: [
    { id: "device_anomaly", label: "Device Anomaly", group: "device" },
    { id: "email_domain_risk", label: "Disposable Email", group: "identity" },
    { id: "velocity_1h", label: "Velocity (1 Hour)", group: "behavioral" },
    { id: "velocity_24h", label: "Velocity (24 Hours)", group: "behavioral" },
    { id: "amount_zscore_high", label: "Amount Outlier (>2.5σ)", group: "financial" },
    { id: "distance_anomaly", label: "Geo-Distance Jump", group: "location" },
    { id: "card_addr_mismatch", label: "Address Mismatch", group: "location" },
    { id: "product_risk", label: "High-Risk Category", group: "behavioral" },
    { id: "high_c_counter", label: "C-Counter Surge", group: "behavioral" },
    { id: "is_fraud", label: "Fraud Spike", group: "outcome" },
  ],
  edges: [
    { from: "device_anomaly", to: "velocity_1h", strength: 0.58 },
    { from: "device_anomaly", to: "distance_anomaly", strength: 0.44 },
    { from: "device_anomaly", to: "card_addr_mismatch", strength: 0.38 },
    { from: "velocity_1h", to: "is_fraud", strength: 0.65 },
    { from: "velocity_1h", to: "velocity_24h", strength: 0.72 },
    { from: "velocity_24h", to: "is_fraud", strength: 0.51 },
    { from: "amount_zscore_high", to: "is_fraud", strength: 0.62 },
    { from: "email_domain_risk", to: "is_fraud", strength: 0.48 },
    { from: "distance_anomaly", to: "is_fraud", strength: 0.42 },
    { from: "card_addr_mismatch", to: "is_fraud", strength: 0.39 },
    { from: "product_risk", to: "is_fraud", strength: 0.35 },
    { from: "high_c_counter", to: "is_fraud", strength: 0.46 },
    { from: "distance_anomaly", to: "card_addr_mismatch", strength: 0.33 },
  ],
};

const FEATURE_WEIGHTS: Record<keyof Omit<SimulatedFeatureState, "transaction_amt">, number> = {
  velocity_1h: 1.85,
  velocity_24h: 1.20,
  amount_zscore_high: 1.65,
  device_anomaly: 1.45,
  email_domain_risk: 1.10,
  distance_anomaly: 0.95,
  card_addr_mismatch: 0.85,
  product_risk: 0.75,
  high_c_counter: 1.05,
};

const BASE_INTERCEPT = -3.20;

export function evaluateInference(state: SimulatedFeatureState): TransactionScore {
  let logit = BASE_INTERCEPT;
  const activeAnomalies: string[] = [];

  for (const [key, val] of Object.entries(state)) {
    if (key === "transaction_amt") continue;
    const feat = key as keyof typeof FEATURE_WEIGHTS;
    if (val) {
      logit += FEATURE_WEIGHTS[feat] || 0.8;
      activeAnomalies.push(feat);
    }
  }

  const prob = 1 / (1 + Math.exp(-logit));
  const flagged = prob >= 0.55;

  const activeSet = new Set(activeAnomalies);
  activeSet.add("is_fraud");

  const causalPath: CausalEdge[] = [];
  for (const edge of CAUSAL_GRAPH_DEF.edges) {
    if (activeSet.has(edge.from) && activeSet.has(edge.to)) {
      causalPath.push(edge);
    }
  }

  return {
    transaction_id: "SIM-" + Math.floor(100000 + Math.random() * 900000),
    fraud_score: Math.round(prob * 1000) / 1000,
    flagged,
    active_anomalies: activeAnomalies,
    causal_path: causalPath,
    transaction_amt: state.transaction_amt,
  };
}
