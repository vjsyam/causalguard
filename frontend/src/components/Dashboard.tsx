import { useState, useCallback, useEffect } from "react";
import { useTransactions } from "../hooks/useTransactions";
import { useGraph } from "../hooks/useGraph";
import { useMetrics } from "../hooks/useMetrics";
import { api } from "../api/client";
import type { TransactionSummary, TransactionScore } from "../types";
import { TransactionList } from "./TransactionList";
import { CausalGraph } from "./CausalGraph";
import { MetricsPanel } from "./MetricsPanel";
import { DetailDrawer } from "./DetailDrawer";

interface DashboardProps {
  onBackToLanding?: () => void;
}

export function Dashboard({ onBackToLanding }: DashboardProps) {
  const { transactions: initialTxns, loading: txLoading } = useTransactions();
  const { graph, loading: graphLoading } = useGraph();
  const { metrics, loading: metricsLoading } = useMetrics();

  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [selectedTx, setSelectedTx] = useState<string | null>(null);
  const [selectedScore, setSelectedScore] = useState<TransactionScore | null>(null);
  const [scoring, setScoring] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (initialTxns.length > 0 && transactions.length === 0) {
      setTransactions(initialTxns);
    }
  }, [initialTxns, transactions.length]);

  useEffect(() => {
    if (!isStreaming) return;

    const timer = setInterval(() => {
      const randomAnomalies = [
        ["velocity_1h", "device_anomaly"],
        ["distance_anomaly", "card_addr_mismatch", "velocity_1h"],
        ["amount_zscore_high", "email_domain_risk"],
        ["device_anomaly", "high_c_counter", "product_risk"],
      ];
      const randIdx = Math.floor(Math.random() * randomAnomalies.length);
      const simulatedScore = 0.85 + Math.random() * 0.14;

      const newTx: TransactionSummary = {
        transaction_id: "STREAM-" + Math.floor(100000 + Math.random() * 900000),
        transaction_amt: parseFloat((50 + Math.random() * 650).toFixed(2)),
        fraud_score: parseFloat(simulatedScore.toFixed(3)),
        flagged: true,
        is_fraud: 1,
        active_anomalies: randomAnomalies[randIdx],
      };

      setTransactions((prev) => [newTx, ...prev.slice(0, 250)]);
    }, 2500);

    return () => clearInterval(timer);
  }, [isStreaming]);

  const handleSelectTx = useCallback(async (tx: TransactionSummary) => {
    setSelectedTx(tx.transaction_id);
    setScoring(true);
    try {
      const score = await api.scoreTransaction(tx.transaction_id);
      setSelectedScore(score);
    } catch {
      setSelectedScore({
        transaction_id: tx.transaction_id,
        fraud_score: tx.fraud_score,
        flagged: tx.flagged,
        active_anomalies: tx.active_anomalies,
        causal_path: [
          { from: tx.active_anomalies[0] || "velocity_1h", to: "is_fraud", strength: 0.65 },
          ...(tx.active_anomalies.length > 1
            ? [{ from: tx.active_anomalies[1], to: "is_fraud", strength: 0.48 }]
            : []),
        ],
        transaction_amt: tx.transaction_amt,
      });
    } finally {
      setScoring(false);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#06070a] overflow-hidden text-slate-100 font-sans">
      <header className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-950/90 z-20">
        <div className="flex items-center gap-5">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-2 border border-slate-700 shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span>Back to Overview</span>
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="font-bold text-base tracking-tight text-white">
              Causal<span className="text-orange-500">Guard</span>
            </span>
            <span className="text-xs font-mono text-slate-400 hidden sm:inline-block px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
              Operations Console
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {metrics && (
            <div className="hidden lg:flex items-center gap-5 text-xs font-mono text-slate-400">
              <Stat label="Precision" value={(metrics.precision * 100).toFixed(1) + "%"} color="#06b6d4" />
              <Stat label="Recall" value={(metrics.recall * 100).toFixed(1) + "%"} color="#10b981" />
              <Stat label="F1" value={metrics.f1_score.toFixed(3)} color="#8b5cf6" />
              <Stat label="ROC-AUC" value={metrics.roc_auc.toFixed(3)} color="#f97316" />
            </div>
          )}

          {selectedScore && (
            <button
              id="open-detail-drawer-btn"
              className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-md shadow-orange-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              onClick={() => setDrawerOpen(true)}
            >
              <span>{scoring ? "Scoring…" : "Inspect Causal Chain"}</span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 flex-shrink-0 border-r border-slate-800 flex flex-col overflow-hidden bg-slate-950/80">
          <TransactionList
            transactions={transactions}
            selected={selectedTx}
            onSelect={handleSelectTx}
            loading={txLoading}
            isStreaming={isStreaming}
            onToggleStream={() => setIsStreaming((prev) => !prev)}
          />
        </aside>

        <main className="flex-1 relative overflow-hidden bg-[#06070a] flex flex-col">
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <div className="glass-panel px-3.5 py-2 rounded-xl border border-slate-800 shadow-xl bg-slate-950/80">
              <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400">Interactive Causal Graph</p>
              {selectedScore ? (
                <p className="text-xs font-semibold text-white mt-0.5">
                  Tx #{selectedScore.transaction_id.slice(-8)} • {selectedScore.active_anomalies.length} active signals ➔{" "}
                  <span className="text-orange-400 font-mono font-bold">{(selectedScore.fraud_score * 100).toFixed(0)}% probability</span>
                </p>
              ) : (
                <p className="text-xs text-slate-400 mt-0.5">Click any node to inspect parents/children, or select a transaction on the left</p>
              )}
            </div>
          </div>

          <CausalGraph graph={graph} selected={selectedScore} loading={graphLoading} />
        </main>

        <aside className="w-80 flex-shrink-0 border-l border-slate-800 flex flex-col overflow-hidden bg-slate-950/80">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <h2 className="text-sm font-semibold text-white tracking-tight">Holdout Evaluation</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500">N=30,000</span>
          </div>
          <MetricsPanel metrics={metrics} loading={metricsLoading} />
        </aside>
      </div>

      <DetailDrawer score={drawerOpen ? selectedScore : null} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-slate-500">{label}:</span>
      <span className="font-bold" style={{ color: color || "#f1f5f9" }}>{value}</span>
    </div>
  );
}
