import { useState, useMemo } from "react";
import type { TransactionSummary } from "../types";

interface Props {
  transactions: TransactionSummary[];
  selected: string | null;
  onSelect: (tx: TransactionSummary) => void;
  loading: boolean;
  isStreaming?: boolean;
  onToggleStream?: () => void;
}

export function TransactionList({
  transactions,
  selected,
  onSelect,
  loading,
  isStreaming = false,
  onToggleStream,
}: Props) {
  const [filter, setFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"score" | "amount" | "id">("score");

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => {
        const matchesText =
          t.transaction_id.toLowerCase().includes(filter.toLowerCase()) ||
          t.active_anomalies.some((a) => a.toLowerCase().includes(filter.toLowerCase()));

        if (!matchesText) return false;
        if (categoryFilter === "all") return true;

        if (categoryFilter === "velocity") {
          return t.active_anomalies.some((a) => a.includes("velocity") || a.includes("counter"));
        }
        if (categoryFilter === "device") {
          return t.active_anomalies.some((a) => a.includes("device"));
        }
        if (categoryFilter === "location") {
          return t.active_anomalies.some((a) => a.includes("distance") || a.includes("addr"));
        }
        if (categoryFilter === "financial") {
          return t.active_anomalies.some((a) => a.includes("amount") || a.includes("product"));
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "score") return b.fraud_score - a.fraud_score;
        if (sortBy === "amount") return b.transaction_amt - a.transaction_amt;
        return b.transaction_id.localeCompare(a.transaction_id);
      });
  }, [transactions, filter, categoryFilter, sortBy]);

  return (
    <div className="flex flex-col h-full bg-slate-950/90 text-slate-100 font-sans">
      <div className="p-3.5 border-b border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isStreaming ? "bg-emerald-400 animate-pulse" : "bg-orange-500"}`} />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              {isStreaming ? "Live Feed Active" : "Flagged Queue"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {onToggleStream && (
              <button
                onClick={onToggleStream}
                className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors cursor-pointer ${
                  isStreaming
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {isStreaming ? "Pause Stream" : "Live Stream"}
              </button>
            )}
            <span className="text-[10px] font-mono text-slate-400">{filtered.length} txns</span>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search ID / signal..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700 font-mono"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 font-mono focus:outline-none cursor-pointer"
          >
            <option value="score">Risk</option>
            <option value="amount">Amount</option>
            <option value="id">ID</option>
          </select>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono">
          {[
            { id: "all", label: "All" },
            { id: "velocity", label: "Velocity" },
            { id: "device", label: "Device" },
            { id: "location", label: "Location" },
            { id: "financial", label: "Amount" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2 py-0.5 rounded-md capitalize transition-colors cursor-pointer whitespace-nowrap ${
                categoryFilter === cat.id
                  ? "bg-orange-600 text-white font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-900">
        {loading ? (
          <div className="flex items-center justify-center h-36 text-slate-500 text-xs font-mono">
            Loading queue...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No matching transactions found.
          </div>
        ) : (
          filtered.map((tx) => {
            const isSelected = tx.transaction_id === selected;
            return (
              <div
                key={tx.transaction_id}
                onClick={() => onSelect(tx)}
                className={`p-3 cursor-pointer select-none transition-colors relative ${
                  isSelected
                    ? "bg-orange-500/10 border-l-2 border-orange-500"
                    : "hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-semibold text-slate-300 truncate max-w-[130px]">
                    #{tx.transaction_id.slice(-8)}
                  </span>
                  <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/30">
                    {(tx.fraud_score * 100).toFixed(0)}% Risk
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white">
                    ${tx.transaction_amt.toFixed(2)}
                  </span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {tx.active_anomalies.slice(0, 2).map((a) => (
                      <span key={a} className="text-[9px] bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded font-mono">
                        {a.replace(/_/g, " ")}
                      </span>
                    ))}
                    {tx.active_anomalies.length > 2 && (
                      <span className="text-[9px] text-slate-500 font-mono">+{tx.active_anomalies.length - 2}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
