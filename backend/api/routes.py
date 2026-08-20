import json
import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from .models import (
    ScoreRequest, ScoreResponse, PaginatedTransactions,
    TransactionSummary, GlobalGraph, GraphNode, GraphEdge, MetricsResponse,
)
from db.database import get_db
from db.models import Transaction
from ml.scorer import load_model, score_transaction
from ml.causal_discovery import load_dag
from ml.metrics import load_metrics
from ml.pipeline import FEATURE_COLS

router = APIRouter()
ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "../artifacts")

# Lazy-load model + DAG once per process
_model_cache: dict = {}


def _get_model_and_dag():
    if "clf" not in _model_cache:
        clf, scaler, threshold = load_model()
        dag = load_dag(ARTIFACTS_DIR)
        _model_cache["clf"]       = clf
        _model_cache["scaler"]    = scaler
        _model_cache["threshold"] = threshold
        _model_cache["dag"]       = dag
    return (
        _model_cache["clf"],
        _model_cache["scaler"],
        _model_cache["threshold"],
        _model_cache["dag"],
    )


# ── POST /score ──────────────────────────────────────────────────────────────
@router.post("/score", response_model=ScoreResponse, tags=["scoring"])
def score_endpoint(req: ScoreRequest, db: Session = Depends(get_db)):
    """
    Score a transaction. Accepts either:
    - transaction_id only: looks up from DB (held-out test set)
    - full feature dict:   scores inline without DB lookup
    """
    clf, scaler, threshold, dag = _get_model_and_dag()

    feature_provided = any(getattr(req, f) is not None for f in FEATURE_COLS)

    if req.transaction_id and not feature_provided:
        tx = db.query(Transaction).filter(
            Transaction.transaction_id == req.transaction_id
        ).first()
        if not tx:
            raise HTTPException(
                status_code=404,
                detail=f"Transaction {req.transaction_id} not found in held-out set",
            )
        row = {
            "transaction_id":  tx.transaction_id,
            "transaction_amt": tx.transaction_amt,
            **{f: getattr(tx, f, 0) for f in FEATURE_COLS},
        }
    else:
        row = {
            "transaction_id":  req.transaction_id or "manual_input",
            "transaction_amt": req.transaction_amt or 0.0,
            **{f: (getattr(req, f) or 0) for f in FEATURE_COLS},
        }

    result = score_transaction(row, clf, scaler, threshold, dag)
    return ScoreResponse(**result)


# ── GET /transactions/flagged ────────────────────────────────────────────────
@router.get("/transactions/flagged", response_model=PaginatedTransactions, tags=["transactions"])
def get_flagged_transactions(
    page:     int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=200),
    db:       Session = Depends(get_db),
):
    """Paginated list of flagged transactions from the held-out test set."""
    query = db.query(Transaction).filter(Transaction.flagged == True)  # noqa: E712
    total = query.count()
    rows  = query.offset((page - 1) * per_page).limit(per_page).all()

    txs = [
        TransactionSummary(
            transaction_id=tx.transaction_id,
            transaction_amt=tx.transaction_amt,
            fraud_score=tx.fraud_score or 0.0,
            flagged=bool(tx.flagged),
            is_fraud=tx.is_fraud,
            active_anomalies=tx.active_anomalies,
        )
        for tx in rows
    ]
    return PaginatedTransactions(
        total=total, page=page, per_page=per_page, transactions=txs
    )


# ── GET /graph/global ────────────────────────────────────────────────────────
@router.get("/graph/global", response_model=GlobalGraph, tags=["graph"])
def get_global_graph():
    """Return the full discovered causal DAG for the dashboard base graph."""
    dag = load_dag(ARTIFACTS_DIR)
    return GlobalGraph(
        nodes=[GraphNode(**n) for n in dag["nodes"]],
        edges=[GraphEdge(**e) for e in dag["edges"]],
    )


# ── GET /metrics ─────────────────────────────────────────────────────────────
@router.get("/metrics", response_model=MetricsResponse, tags=["metrics"])
def get_metrics():
    """
    Return precision/recall/F1/FPR/cost on the held-out test set.
    Metrics are NEVER cherry-picked or computed on training data.
    """
    try:
        m = load_metrics()
        return MetricsResponse(**m)
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Metrics not ready. Run backend/train.py first.",
        )
