import { useState } from "react";
import type { Metrics } from "../types";

interface Props {
  metrics: Metrics | null;
  loading: boolean;
}

export function MetricsPanel({ metrics, loading }: Props) {
  const [sliderThreshold, setSliderThreshold] = useState(0.55);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-xs font-mono text-slate-500">
        Computing holdout metrics...
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-4 text-xs text-slate-500">
        Metrics unavailable.
      </div>
    );
  }

  const cm = metrics.confusion_matrix;

  const currentPoint = metrics.threshold_sweep?.find(
    (p) => Math.abs(p.threshold - sliderThreshold) < 0.03
  ) || {
    threshold: sliderThreshold,
    total_cost: metrics.cost_analysis.total_cost_at_threshold,
    fp: cm.fp,
    fn: cm.fn,
    precision: metrics.precision,
    recall: metrics.recall,
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
      <div className="grid grid-cols-2 gap-2.5">
        <StatTile label="Precision" value={(metrics.precision * 100).toFixed(1) + "%"} color="#06b6d4" />
        <StatTile label="Recall" value={(metrics.recall * 100).toFixed(1) + "%"} color="#10b981" />
        <StatTile label="F1 Score" value={metrics.f1_score.toFixed(3)} color="#8b5cf6" />
        <StatTile label="ROC-AUC" value={metrics.roc_auc.toFixed(3)} color="#f97316" />
        <StatTile label="False Pos Rate" value={(metrics.false_positive_rate * 100).toFixed(2) + "%"} color="#06b6d4" />
        <StatTile label="Optimal Cutoff" value={metrics.threshold_used.toFixed(2)} color="#f59e0b" />
      </div>

      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold text-white uppercase tracking-wider">Threshold Loss Sweep</span>
          <span className="text-orange-400 font-bold font-mono">{sliderThreshold.toFixed(2)}</span>
        </div>

        <input
          type="range"
          min="0.10"
          max="0.90"
          step="0.05"
          value={sliderThreshold}
          onChange={(e) => setSliderThreshold(parseFloat(e.target.value))}
          className="w-full accent-orange-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
        />

        <div className="flex justify-between text-[10px] text-slate-500">
          <span>0.10 (Aggressive)</span>
          <span className="text-amber-400 font-bold">0.55 (Optimal)</span>
          <span>0.90 (Permissive)</span>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-[11px]">
          <span className="text-slate-400">Projected Holdout Loss:</span>
          <span className="text-emerald-400 font-bold">${currentPoint.total_cost.toLocaleString()}</span>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="text-[11px] font-bold text-white uppercase tracking-wider">Dataset Parameters</div>
        <Row label="Holdout Size" val={metrics.held_out_set_size.toLocaleString()} />
        <Row label="Fraud Count" val={metrics.fraud_count.toLocaleString()} color="#f97316" />
        <Row label="Legit Count" val={metrics.legit_count.toLocaleString()} color="#06b6d4" />
        <Row label="Fraud Ratio" val={metrics.fraud_rate_pct + "%"} />
        <Row label="Class Ratio" val={metrics.class_imbalance_ratio} />
      </div>

      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="text-[11px] font-bold text-white uppercase tracking-wider">Economic Loss Model</div>
        <Row label="FP Review Cost" val="$15.00 / txn" />
        <Row label="FN Fraud Loss" val="$120.00 / txn" />
        <Row label="Total FP Cost" val={"$" + metrics.cost_analysis.total_false_positive_cost.toLocaleString()} />
        <Row label="Total FN Loss" val={"$" + metrics.cost_analysis.total_false_negative_cost.toLocaleString()} color="#f97316" />
        <div className="pt-2 border-t border-slate-800 flex justify-between font-bold">
          <span className="text-slate-400">Total Min Loss:</span>
          <span className="text-emerald-400">${metrics.cost_analysis.total_cost_at_threshold.toLocaleString()}</span>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
        <div className="text-[11px] font-bold text-white uppercase tracking-wider mb-2.5">Confusion Matrix</div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <Cell label="TP (Hit)" val={cm.tp} color="#06b6d4" />
          <Cell label="FP (Alarm)" val={cm.fp} color="#f97316" />
          <Cell label="FN (Miss)" val={cm.fn} color="#f97316" />
          <Cell label="TN (Pass)" val={cm.tn} color="#10b981" />
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
      <span className="text-[10px] text-slate-500 uppercase">{label}</span>
      <div className="text-xl font-bold mt-1" style={{ color }}>{value}</div>
    </div>
  );
}

function Row({ label, val, color }: { label: string; val: string; color?: string }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-slate-500">{label}:</span>
      <span className="font-semibold" style={{ color: color || "#cbd5e1" }}>{val}</span>
    </div>
  );
}

function Cell({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div className="p-2 rounded bg-slate-950 border border-slate-800">
      <div className="text-base font-bold" style={{ color }}>{val.toLocaleString()}</div>
      <div className="text-[9px] text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}
