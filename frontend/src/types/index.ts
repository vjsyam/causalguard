export interface CausalEdge {
  from: string;
  to: string;
  strength: number;
}

export interface TransactionScore {
  transaction_id: string;
  fraud_score: number;
  flagged: boolean;
  active_anomalies: string[];
  causal_path: CausalEdge[];
  transaction_amt: number;
}

export interface TransactionSummary {
  transaction_id: string;
  transaction_amt: number;
  fraud_score: number;
  flagged: boolean;
  is_fraud: number;
  active_anomalies: string[];
}

export interface PaginatedTransactions {
  total: number;
  page: number;
  per_page: number;
  transactions: TransactionSummary[];
}

export interface GraphNode {
  id: string;
  label: string;
  group: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  strength: number;
}

export interface GlobalGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ConfusionMatrix {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export interface CostAnalysis {
  total_false_positive_cost: number;
  total_false_negative_cost: number;
  total_cost_at_threshold: number;
}

export interface ThresholdPoint {
  threshold: number;
  total_cost: number;
  fp: number;
  fn: number;
  tp: number;
  tn: number;
  precision: number;
  recall: number;
}

export interface Metrics {
  dataset_note: string;
  held_out_set_size: number;
  fraud_count: number;
  legit_count: number;
  fraud_rate_pct: number;
  class_imbalance_ratio: string;
  threshold_used: number;
  fp_cost_assumption: string;
  fn_cost_assumption: string;
  precision: number;
  recall: number;
  f1_score: number;
  false_positive_rate: number;
  roc_auc: number;
  confusion_matrix: ConfusionMatrix;
  cost_analysis: CostAnalysis;
  threshold_sweep: ThresholdPoint[];
}

export interface SimulatedFeatureState {
  velocity_1h: boolean;
  velocity_24h: boolean;
  amount_zscore_high: boolean;
  device_anomaly: boolean;
  email_domain_risk: boolean;
  distance_anomaly: boolean;
  card_addr_mismatch: boolean;
  product_risk: boolean;
  high_c_counter: boolean;
  transaction_amt: number;
}
