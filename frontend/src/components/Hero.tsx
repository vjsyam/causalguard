import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Navbar } from "./Navbar";
import { LiveSimulator } from "./LiveSimulator";
import { BentoGrid } from "./BentoGrid";
import { MetricsAudit } from "./MetricsAudit";
import { ApiConsole } from "./ApiConsole";
import { Footer } from "./Footer";
import { SparkleCanvas } from "./SparkleCanvas";
import { AnimatedCausalGraph } from "./AnimatedCausalGraph";

interface HeroProps {
  onEnterDashboard: () => void;
}

const ROTATING_MATH = [
  "Constraint-Based Structure Discovery (PC Algorithm, α=0.05)",
  "Asymmetric Cost Optimization: min_θ (15·FP + 120·FN)",
  "Counterfactual Interventions via Pearl's do-calculus",
  "Deterministic Multi-Hop Anomaly Graph Traversal",
];

export function Hero({ onEnterDashboard }: HeroProps) {
  const [mathIdx, setMathIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMathIdx((prev) => (prev + 1) % ROTATING_MATH.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen bg-[#06070a] text-slate-100 flex flex-col justify-between overflow-x-hidden">
      <SparkleCanvas />
      
      <div 
        className="absolute top-28 right-0 w-[600px] h-[400px] bg-gradient-to-bl from-orange-600/10 via-amber-500/5 to-transparent rounded-full blur-[120px] pointer-events-none -z-10"
        aria-hidden="true" 
      />

      <Navbar onEnterDashboard={onEnterDashboard} onScrollToSection={scrollTo} />

      <header className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-16 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-orange-400 font-bold">SYSTEM ACTIVE</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">PC-Algorithm v2.4 (Fisher-Z α=0.05)</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
              Causal Structure Discovery for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
                Payment Fraud Spikes.
              </span>
            </h1>

            <div className="h-8 flex items-center">
              <span className="text-xs font-mono text-slate-500 mr-2 uppercase tracking-wider">Methodology:</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={mathIdx}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -8, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40"
                >
                  {ROTATING_MATH[mathIdx]}
                </motion.span>
              </AnimatePresence>
            </div>

            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
              Traditional gradient-boosted trees and SHAP attributions only identify correlation, yielding expensive false alarms on high-value transactions. CausalGuard maps the exact directed causal trajectory of anomaly signals in sub-4ms execution.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={onEnterDashboard}
                aria-label="Launch Operations Console"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-sm shadow-xl shadow-orange-600/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
              >
                <span>Launch Operations Console</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>

              <button
                onClick={() => scrollTo("simulator-section")}
                aria-label="Test Signal Simulator"
                className="px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
                <span>Test Live Simulator</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 font-mono text-left">
              <div>
                <div className="text-xl font-black text-cyan-400">100.0%</div>
                <div className="text-[11px] text-slate-500 uppercase mt-0.5">Holdout Precision</div>
              </div>
              <div>
                <div className="text-xl font-black text-emerald-400">99.1%</div>
                <div className="text-[11px] text-slate-500 uppercase mt-0.5">Holdout Recall</div>
              </div>
              <div>
                <div className="text-xl font-black text-orange-400">$1,200</div>
                <div className="text-[11px] text-slate-500 uppercase mt-0.5">30k Cost Minimum</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 w-full">
            <div 
              id="dag-section" 
              className="rounded-2xl glass-panel border border-slate-800/90 p-5 bg-slate-950/80 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  <span className="font-bold text-white uppercase tracking-wider">Discovered Causal Topology</span>
                </div>
                <span className="text-slate-500 text-[10px]">10 Nodes • 13 Directed Edges</span>
              </div>

              <div className="w-full h-[360px]">
                <AnimatedCausalGraph />
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Objective: min_θ (15·FP + 120·FN)</span>
                <span className="text-emerald-400 font-bold">θ* = 0.55</span>
              </div>
            </div>
          </div>

        </div>
      </header>

      <main>
        <LiveSimulator />
        <BentoGrid />
        <MetricsAudit />
        <ApiConsole />
      </main>

      <Footer onOpenConsole={onEnterDashboard} />
    </div>
  );
}
