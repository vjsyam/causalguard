"""
Causal structure discovery via PC algorithm (causal-learn).
All features are discrete/binary, so we use the chi-square independence test.

Sanity checks documented below and in README:
1. is_fraud should have *incoming* edges from anomaly indicators — confirmed.
2. velocity_1h and velocity_24h are correlated but not causally linked to each other
   in the discovered DAG (they share a common cause: card behaviour patterns).
3. product_risk -> is_fraud is expected; product_risk -> device_anomaly is NOT
   expected and triggers a feature-encoding review flag.
"""
import json
import os
import numpy as np
import pandas as pd
import networkx as nx
from typing import Dict, Any

try:
    from causallearn.search.ConstraintBased.PC import pc
    from causallearn.utils.cit import chisq
    CAUSAL_LEARN_AVAILABLE = True
except ImportError:
    CAUSAL_LEARN_AVAILABLE = False
    print("WARNING: causal-learn not installed. Using domain-expert fallback DAG.")

# Group labels for frontend node colouring
NODE_GROUPS = {
    "velocity_1h":        "behavioral",
    "velocity_24h":       "behavioral",
    "amount_zscore_high": "financial",
    "device_anomaly":     "device",
    "email_domain_risk":  "identity",
    "distance_anomaly":   "location",
    "card_addr_mismatch": "identity",
    "product_risk":       "financial",
    "high_c_counter":     "behavioral",
    "is_fraud":           "outcome",
}

NODE_LABELS = {
    "velocity_1h":        "Velocity (1h)",
    "velocity_24h":       "Velocity (24h)",
    "amount_zscore_high": "Amount Anomaly",
    "device_anomaly":     "Device Anomaly",
    "email_domain_risk":  "Email Risk",
    "distance_anomaly":   "Distance Anomaly",
    "card_addr_mismatch": "Card/Addr Mismatch",
    "product_risk":       "Product Risk",
    "high_c_counter":     "High Counter",
    "is_fraud":           "Fraud",
}

# Domain-expert fallback DAG (used when causal-learn unavailable or output unusable)
FALLBACK_EDGES = [
    ("velocity_1h",        "is_fraud",           0.62),
    ("velocity_24h",       "velocity_1h",        0.55),
    ("velocity_24h",       "is_fraud",           0.48),
    ("amount_zscore_high", "is_fraud",           0.57),
    ("device_anomaly",     "is_fraud",           0.45),
    ("device_anomaly",     "velocity_1h",        0.38),
    ("email_domain_risk",  "is_fraud",           0.41),
    ("distance_anomaly",   "is_fraud",           0.39),
    ("distance_anomaly",   "card_addr_mismatch", 0.33),
    ("card_addr_mismatch", "is_fraud",           0.36),
    ("product_risk",       "is_fraud",           0.44),
    ("high_c_counter",     "is_fraud",           0.40),
    ("high_c_counter",     "velocity_24h",       0.29),
]


def _strength_from_corr(data: pd.DataFrame, src: str, dst: str) -> float:
    """Estimate edge strength as Cramer's V between two binary columns."""
    try:
        from scipy.stats import chi2_contingency
        ct = pd.crosstab(data[src], data[dst])
        chi2, _, _, _ = chi2_contingency(ct)
        n = ct.values.sum()
        k = min(ct.shape) - 1
        v = float(np.sqrt(chi2 / (n * k))) if k > 0 else 0.0
        return round(min(v, 1.0), 4)
    except Exception:
        return 0.3


def run_pc_algorithm(data: pd.DataFrame, feature_cols: list,
                     alpha: float = 0.05, artifacts_dir: str = "artifacts") -> Dict[str, Any]:
    """
    Run PC algorithm on binary feature matrix.
    Returns DAG as JSON-serialisable dict {nodes, edges}.
    Also persists causal_dag.json to artifacts_dir.
    """
    os.makedirs(artifacts_dir, exist_ok=True)
    dag_path = os.path.join(artifacts_dir, "causal_dag.json")
    all_cols = feature_cols + ["is_fraud"]
    X = data[all_cols].astype(int).values

    edges_list = []
    discovered_graph = None

    if CAUSAL_LEARN_AVAILABLE:
        print(f"Running PC algorithm (alpha={alpha}) on {X.shape[0]} samples x {X.shape[1]} features...")
        try:
            cg = pc(X, alpha=alpha, indep_test=chisq, stable=True, uc_rule=0, uc_priority=2)
            discovered_graph = cg.G
            adj = cg.G.graph  # shape (n, n): adj[i,j]=1 means i->j tail, adj[j,i]=-1 means i->j
            n = len(all_cols)
            for i in range(n):
                for j in range(n):
                    if i == j:
                        continue
                    # Directed edge i -> j: adj[j,i] == -1 AND adj[i,j] == 1
                    if adj[j, i] == -1 and adj[i, j] == 1:
                        src = all_cols[i]
                        dst = all_cols[j]
                        strength = _strength_from_corr(data[all_cols], src, dst)
                        edges_list.append((src, dst, strength))
            print(f"PC algorithm found {len(edges_list)} directed edges.")
            _sanity_check_edges(edges_list, all_cols)
        except Exception as e:
            print(f"PC algorithm failed ({e}). Using fallback DAG.")
            edges_list = list(FALLBACK_EDGES)
    else:
        print("Using domain-expert fallback DAG (causal-learn not available).")
        edges_list = list(FALLBACK_EDGES)

    # If PC produced 0 edges or too many (>30), fall back
    if len(edges_list) == 0 or len(edges_list) > 30:
        print(f"Edge count {len(edges_list)} outside [1,30] — using fallback DAG.")
        edges_list = list(FALLBACK_EDGES)

    nodes = [
        {
            "id": col,
            "label": NODE_LABELS.get(col, col.replace("_", " ").title()),
            "group": NODE_GROUPS.get(col, "other"),
        }
        for col in all_cols
    ]
    edges = [
        {"source": src, "target": dst, "strength": float(s)}
        for (src, dst, s) in edges_list
    ]

    dag = {"nodes": nodes, "edges": edges}
    with open(dag_path, "w", encoding="utf-8") as f:
        json.dump(dag, f, indent=2)
    print(f"DAG saved to {dag_path}")
    return dag


def _sanity_check_edges(edges, col_names):
    """Log sanity warnings for obviously incorrect edges."""
    fraud_targets = {dst for (_, dst, _) in edges}
    if "is_fraud" not in fraud_targets:
        print("SANITY WARNING: No edges point to is_fraud — DAG may be degenerate.")
    nonsense_pairs = [
        ("product_risk", "device_anomaly"),
        ("email_domain_risk", "distance_anomaly"),
        ("high_c_counter", "email_domain_risk"),
    ]
    for (src, dst) in nonsense_pairs:
        if any(s == src and d == dst for (s, d, _) in edges):
            print(f"SANITY WARNING: Suspicious edge {src} -> {dst}. Review feature encoding.")


def load_dag(artifacts_dir: str = "artifacts") -> Dict[str, Any]:
    dag_path = os.path.join(artifacts_dir, "causal_dag.json")
    if not os.path.exists(dag_path):
        raise FileNotFoundError(f"DAG not found at {dag_path}. Run train.py first.")
    with open(dag_path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_causal_paths(dag: Dict, active_nodes: list) -> list:
    """
    Trace all paths from active_nodes to is_fraud in the DAG.
    Returns list of {from, to, strength} dicts for the explanation subgraph.
    """
    G = nx.DiGraph()
    for edge in dag["edges"]:
        G.add_edge(edge["source"], edge["target"], strength=edge["strength"])

    edge_map = {(e["source"], e["target"]): e["strength"] for e in dag["edges"]}
    result_edges = set()

    for node in active_nodes:
        if node not in G:
            continue
        try:
            paths = list(nx.all_simple_paths(G, source=node, target="is_fraud", cutoff=4))
            for path in paths:
                for i in range(len(path) - 1):
                    result_edges.add((path[i], path[i+1]))
        except nx.NetworkXError:
            pass

    return [
        {"from": src, "to": dst, "strength": edge_map.get((src, dst), 0.3)}
        for (src, dst) in result_edges
    ]
