import { useState, useMemo } from "react";
import { evaluateInference } from "../utils/causalSimulator";
import type { SimulatedFeatureState, CausalEdge } from "../types";

const INITIAL_STATE: SimulatedFeatureState = {
  velocity_1h: true,
  velocity_24h: true,
  amount_zscore_high: false,
  device_anomaly: true,
  email_domain_risk: false,
  distance_anomaly: false,
  card_addr_mismatch: false,
  product_risk: false,
  high_c_counter: false,
  transaction_amt: 348.5,
};

const ATTACK_PRESETS = [
  {
    name: "Rapid Card Testing",
    desc: "High 1h velocity + device spoofing",
    state: {
      velocity_1h: true,
      velocity_24h: true,
      amount_zscore_high: false,
      device_anomaly: true,
      email_domain_risk: false,
      distance_anomaly: false,
      card_addr_mismatch: false,
      product_risk: false,
      high_c_counter: true,
      transaction_amt: 85.0,
    },
  },
  {
    name: "Geo-Distance Jump",
    desc: "IP coordinate surge + address mismatch",
    state: {
      velocity_1h: false,
      velocity_24h: false,
      amount_zscore_high: false,
      device_anomaly: true,
      email_domain_risk: true,
      distance_anomaly: true,
      card_addr_mismatch: true,
      product_risk: false,
      high_c_counter: false,
      transaction_amt: 220.0,
    },
  },
  {
    name: "High-Ticket Gift Card Drain",
    desc: "Amount outlier (>2.5σ) + risky product",
    state: {
      velocity_1h: false,
      velocity_24h: true,
      amount_zscore_high: true,
      device_anomaly: true,
      email_domain_risk: true,
      distance_anomaly: false,
      card_addr_mismatch: false,
      product_risk: true,
      high_c_counter: true,
      transaction_amt: 850.0,
    },
  },
  {
    name: "Legitimate Cardholder",
    desc: "Clean baseline transaction",
    state: {
      velocity_1h: false,
      velocity_24h: false,
      amount_zscore_high: false,
      device_anomaly: false,
      email_domain_risk: false,
      distance_anomaly: false,
      card_addr_mismatch: false,
      product_risk: false,
      high_c_counter: false,
      transaction_amt: 45.0,
    },
  },
];

export function LiveSimulator() {
  const [features, setFeatures] = useState<SimulatedFeatureState>(INITIAL_STATE);
  const [intervenedFeature, setIntervenedFeature] = useState<string | null>(null);

  const result = useMemo(() => evaluateInference(features), [features]);

  const counterfactualResult = useMemo(() => {
    if (!intervenedFeature) return null;
    const cfFeatures = { ...features, [intervenedFeature]: false };
    return evaluateInference(cfFeatures);
  }, [features, intervenedFeature]);

  const toggleFeature = (key: keyof Omit<SimulatedFeatureState, "transaction_amt">) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const featureList: { key: keyof Omit<SimulatedFeatureState, "transaction_amt">; label: string; cat: string }[] = [
    { key: "velocity_1h", label: "Velocity (1 Hour)", cat: "Behavioral" },
    { key: "velocity_24h", label: "Velocity (24 Hours)", cat: "Behavioral" },
    { key: "high_c_counter", label: "C-Counter Surge", cat: "Behavioral" },
    { key: "device_anomaly", label: "Device Anomaly", cat: "Device" },
    { key: "distance_anomaly", label: "Geo-Distance Jump", cat: "Location" },
    { key: "card_addr_mismatch", label: "Address Mismatch", cat: "Location" },
    { key: "amount_zscore_high", label: "Amount Outlier (>2.5σ)", cat: "Financial" },
    { key: "product_risk", label: "High-Risk Product", cat: "Behavioral" },
    { key: "email_domain_risk", label: "Disposable Email", cat: "Identity" },
  ];

  return (
    <section id="simulator-section" className="py-20 px-4 max-w-6xl mx-auto w-full relative z-10 font-sans">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-xs font-mono text-orange-400 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          <span>Interactive Risk Sandbox</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Test the Causal Engine in Real-Time
        </h2>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mt-3">
          Toggle anomaly signals or select an attack preset to observe instant causal chain resolution and counterfactual interventions.
        </p>

        <div className="flex flex-wrap justify-center gap-2.5 mt-6">
          {ATTACK_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                setFeatures(preset.state);
                setIntervenedFeature(null);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800/90 bg-slate-950/70 shadow-2xl space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2 font-mono">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Transaction Amount</span>
              <span className="text-base font-black text-orange-400">${features.transaction_amt.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="10"
              max="1500"
              step="10"
              value={features.transaction_amt}
              onChange={(e) => setFeatures((p) => ({ ...p, transaction_amt: parseFloat(e.target.value) }))}
              className="w-full accent-orange-500 bg-slate-800 rounded-lg cursor-pointer h-2"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>$10</span>
              <span>$750</span>
              <span>$1,500</span>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-3 font-mono">
              Signal Toggles (9 Anomaly Indicators)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {featureList.map(({ key, label, cat }) => {
                const active = features[key];
                return (
                  <button
                    key={key}
                    onClick={() => toggleFeature(key)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      active
                        ? "bg-orange-500/15 border-orange-500/40 text-white shadow-md shadow-orange-500/10"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{label}</div>
                      <div className="text-[10px] font-mono text-slate-500 capitalize">{cat}</div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        active ? "bg-orange-500 border-orange-400" : "border-slate-700 bg-slate-800"
                      }`}
                    >
                      {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800/90 bg-slate-950/80 shadow-2xl space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-5">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Live Inference Output</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                result.flagged ? "bg-orange-500/20 text-orange-400 border border-orange-500/40" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
              }`}>
                {result.flagged ? "DECISION: BLOCKED" : "DECISION: APPROVED"}
              </span>
            </div>

            <div className="text-center p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 mb-6 relative overflow-hidden">
              <div className="text-5xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                {(result.fraud_score * 100).toFixed(1)}%
              </div>
              <div className="text-xs font-mono text-slate-400 uppercase tracking-widest mt-1">
                Estimated Fraud Probability
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-2">
                Cost-Optimal Cutoff: <strong>0.55</strong> • {result.active_anomalies.length} Signals Active
              </div>
            </div>

            {result.active_anomalies.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-2 mb-4 font-mono text-xs">
                <div className="flex items-center justify-between text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
                  <span>Counterfactual Intervention</span>
                  <span>Pearl's do(X=0)</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  What if we challenge with 2FA and eliminate a root cause?
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {result.active_anomalies.map((a: string) => (
                    <button
                      key={a}
                      onClick={() => setIntervenedFeature(intervenedFeature === a ? null : a)}
                      className={`px-2 py-1 rounded text-[10px] border transition-colors cursor-pointer ${
                        intervenedFeature === a
                          ? "bg-cyan-500 text-slate-950 font-bold border-cyan-400"
                          : "bg-slate-950 text-cyan-300 border-cyan-800/60 hover:bg-cyan-950"
                      }`}
                    >
                      do({a.replace(/_/g, " ")} = 0)
                    </button>
                  ))}
                </div>

                {counterfactualResult && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Post-Intervention Risk:</span>
                    <span className="text-emerald-400 font-bold">
                      {(counterfactualResult.fraud_score * 100).toFixed(1)}% ({((counterfactualResult.fraud_score - result.fraud_score) * 100).toFixed(1)}% reduction)
                    </span>
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Active Directed Causal Chain
              </div>
              {result.causal_path.length === 0 ? (
                <div className="p-3 rounded-lg bg-slate-900 text-slate-500 text-xs font-mono text-center">
                  No anomalous path propagated to fraud outcome.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {result.causal_path.map((edge: CausalEdge) => (
                    <div
                      key={`${edge.from}->${edge.to}`}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono flex items-center justify-between"
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
        </div>
      </div>
    </section>
  );
}
