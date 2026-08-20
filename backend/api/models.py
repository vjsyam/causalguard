from pydantic import BaseModel, Field
from typing import List, Optional


class CausalEdge(BaseModel):
    source: str = Field(..., alias="from")
    target: str = Field(..., alias="to")
    strength: float

    model_config = {"populate_by_name": True}


class ScoreRequest(BaseModel):
    transaction_id:       Optional[str] = None
    transaction_amt:      Optional[float] = None
    velocity_1h:          Optional[int] = Field(default=None, ge=0, le=1)
    velocity_24h:         Optional[int] = Field(default=None, ge=0, le=1)
    amount_zscore_high:   Optional[int] = Field(default=None, ge=0, le=1)
    device_anomaly:       Optional[int] = Field(default=None, ge=0, le=1)
    email_domain_risk:    Optional[int] = Field(default=None, ge=0, le=1)
    distance_anomaly:     Optional[int] = Field(default=None, ge=0, le=1)
    card_addr_mismatch:   Optional[int] = Field(default=None, ge=0, le=1)
    product_risk:         Optional[int] = Field(default=None, ge=0, le=1)
    high_c_counter:       Optional[int] = Field(default=None, ge=0, le=1)


class ScoreResponse(BaseModel):
    transaction_id:   str
    fraud_score:      float
    flagged:          bool
    active_anomalies: List[str]
    causal_path:      List[dict]
    transaction_amt:  float


class TransactionSummary(BaseModel):
    transaction_id:   str
    transaction_amt:  float
    fraud_score:      float
    flagged:          bool
    is_fraud:         int
    active_anomalies: List[str]


class PaginatedTransactions(BaseModel):
    total:        int
    page:         int
    per_page:     int
    transactions: List[TransactionSummary]


class GraphNode(BaseModel):
    id:    str
    label: str
    group: str


class GraphEdge(BaseModel):
    source:   str
    target:   str
    strength: float


class GlobalGraph(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]


class MetricsResponse(BaseModel):
    dataset_note:            str
    held_out_set_size:       int
    fraud_count:             int
    legit_count:             int
    fraud_rate_pct:          float
    class_imbalance_ratio:   str
    threshold_used:          float
    fp_cost_assumption:      str
    fn_cost_assumption:      str
    precision:               float
    recall:                  float
    f1_score:                float
    false_positive_rate:     float
    roc_auc:                 float
    confusion_matrix:        dict
    cost_analysis:           dict
    threshold_sweep:         list
