import { AnimatePresence, motion } from "motion/react";
import type { TransactionScore } from "../types";

interface Props {
  score: TransactionScore | null;
  onClose: () => void;
}

export function DetailDrawer({ score, onClose }: Props) {
  const handleExportSAR = () => {
    if (!score) return;
    const sarReport = `# SUSPICIOUS ACTIVITY REPORT (SAR) / CAUSAL AUDIT DOSSIER
Case Ref: SAR-${score.transaction_id}
Generated: ${new Date().toISOString()}
Target: Transaction ID #${score.transaction_id}

## 1. Executive Summary
- Estimated Fraud Probability: ${(score.fraud_score * 100).toFixed(1)}%
- Decision Boundary: BLOCKED (Threshold = 0.55)
- Transaction Amount: $${score.transaction_amt.toFixed(2)}
- Active Anomalous Indicators Count: ${score.active_anomalies.length}

## 2. Active Risk Indicators
${score.active_anomalies.map((a) => `- ${a.replace(/_/g, " ").toUpperCase()}`).join("\n")}

## 3. Discovered Causal Trajectory (PC Algorithm DAG)
${score.causal_path
  .map(
    (e, i) =>
      `${i + 1}. ${e.from.toUpperCase()} ──[weight: ${e.strength.toFixed(2)}]──> ${e.to.toUpperCase()}`
  )
  .join("\n")}

## 4. Plain-English Compliance Rationale
The transaction was blocked due to a chain of correlated anomalies rooted in ${
      score.active_anomalies[0] || "behavioral deviations"
    }. Structural equation modeling confirmed directed causal propagation into the fraud outcome node, exceeding the calibrated empirical risk threshold.

## 5. Audit Signature
Auditor: Automated CausalGuard Risk Engine v2.0
Method: Constraint-Based PC Causal Discovery (causal-learn)
`;

    const blob = new Blob([sarReport], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SAR_${score.transaction_id}_Audit_Report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {score && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 240 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
              <div>
                <span className="text-xs text-slate-400 font-mono">Transaction ID #{score.transaction_id}</span>
                <h3 className="text-base font-bold text-white mt-0.5">Causal Attribution Analysis</h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Risk Assessment</span>
                  <span className="text-3xl font-black font-mono text-orange-400">
                    {(score.fraud_score * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Amount: ${score.transaction_amt.toFixed(2)}</span>
                  <span className="text-orange-400 font-bold">Decision: BLOCKED</span>
                </div>
              </div>

              <button
                onClick={handleExportSAR}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-400 flex items-center justify-center gap-2 transition-colors cursor-pointer shadow font-mono"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <span>Export Audit Report (SAR Markdown)</span>
              </button>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono block">
                  Causal Narrative
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The transaction was flagged with <strong className="text-orange-400">{(score.fraud_score * 100).toFixed(0)}% estimated fraud probability</strong>. Causal structure analysis mapped {score.active_anomalies.length} active risk indicators. The most prominent causal sequence traces from <em>{score.active_anomalies[0]}</em> propagating into <em>is_fraud</em>.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 font-mono">
                  Active Anomaly Indicators ({score.active_anomalies.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {score.active_anomalies.map((a) => (
                    <span
                      key={a}
                      className="text-xs px-2.5 py-1 rounded-md bg-slate-900 border border-orange-500/30 text-orange-300 font-mono"
                    >
                      {a.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 font-mono">
                  Directed Causal Chain ({score.causal_path.length} links)
                </h4>
                {score.causal_path.length === 0 ? (
                  <p className="text-xs text-slate-500">No anomalous path recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {score.causal_path.map((edge) => (
                      <div
                        key={`${edge.from}->${edge.to}`}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono"
                      >
                        <div className="flex items-center gap-2 text-cyan-300">
                          <span>{edge.from.replace(/_/g, " ")}</span>
                          <span className="text-orange-500 font-bold">→</span>
                          <span className={edge.to === "is_fraud" ? "text-orange-400 font-bold" : "text-cyan-300"}>
                            {edge.to.replace(/_/g, " ")}
                          </span>
                        </div>
                        <span className="text-slate-500 text-[10px]">w = {edge.strength.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
