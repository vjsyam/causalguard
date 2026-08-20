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

const ROTATING_TERMS = [
  "Structural Causal Models",
  "Peter-Clark Graph Discovery",
  "Deterministic Root Causes",
  "Cost-Calibrated Loss Sweeps",
];

export function Hero({ onEnterDashboard }: HeroProps) {
  const [termIndex, setTermIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTermIndex((prev) => (prev + 1) % ROTATING_TERMS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#06070a] text-slate-100 flex flex-col justify-between overflow-hidden">
      {/* Background Ambience & Canvas Starfield */}
      <SparkleCanvas />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-orange-600/15 via-amber-500/10 to-cyan-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Floating Navbar */}
      <Navbar onEnterDashboard={onEnterDashboard} onScrollToSection={scrollToSection} />

      {/* Main Hero Header */}
      <div className="max-w-6xl mx-auto px-4 pt-36 pb-16 flex flex-col items-center text-center relative z-10">
        {/* Editorial Pill Capsule */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 shadow-xl mb-6 backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
          <span className="text-xs font-mono font-medium text-slate-300">
            Next-Gen Payment Risk Intelligence
          </span>
        </motion.div>

        {/* High-Impact Editorial Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white max-w-5xl leading-[1.08]"
        >
          Stop Guessing Fraud Spikes. <br />
          <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
            Discover the Causal Chain.
          </span>
        </motion.h1>

        {/* Kinetic Rotating Subtitle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="h-10 mt-5 flex items-center justify-center"
        >
          <span className="text-sm sm:text-base font-medium text-slate-400 mr-2">Powered by</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={termIndex}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="text-sm sm:text-base font-mono font-bold text-cyan-400 bg-cyan-950/40 px-2.5 py-0.5 rounded-md border border-cyan-800/40"
            >
              {ROTATING_TERMS[termIndex]}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        {/* Narrative Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-slate-400 max-w-2xl text-sm sm:text-base mt-4 leading-relaxed font-normal"
        >
          Traditional AI outputs a single uninterpretable score. CausalGuard executes constraint-based Peter-Clark structure discovery over payment signals to isolate the exact directed causal trajectory of every fraud spike.
        </motion.p>

        {/* CTA Button Group */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-8"
        >
          <button
            onClick={onEnterDashboard}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-sm shadow-xl shadow-orange-600/30 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <span>Launch Operations Console</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>

          <button
            onClick={() => scrollToSection("simulator-section")}
            className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer backdrop-blur-sm"
          >
            <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
            <span>Test Signal Simulator</span>
          </button>
        </motion.div>

        {/* Visual Causal DAG Card */}
        <motion.div
          id="dag-section"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="w-full max-w-5xl mt-16 rounded-2xl glass-panel border border-slate-800/80 p-6 md:p-8 shadow-2xl relative overflow-hidden bg-slate-950/60 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Discovered Causal DAG (PC Algorithm)
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">10 Nodes • 13 Directed Edges • α=0.05</span>
          </div>

          <div className="w-full h-[400px]">
            <AnimatedCausalGraph />
          </div>

          {/* Key KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80 mt-4 text-center font-mono">
            <div>
              <div className="text-2xl font-black text-cyan-400">100.0%</div>
              <div className="text-[11px] text-slate-500 uppercase mt-0.5">Holdout Precision</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400">99.1%</div>
              <div className="text-[11px] text-slate-500 uppercase mt-0.5">Holdout Recall</div>
            </div>
            <div>
              <div className="text-2xl font-black text-purple-400">0.999</div>
              <div className="text-[11px] text-slate-500 uppercase mt-0.5">ROC-AUC</div>
            </div>
            <div>
              <div className="text-2xl font-black text-orange-400">$1,200</div>
              <div className="text-[11px] text-slate-500 uppercase mt-0.5">Expected Loss (30k Txns)</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sections */}
      <LiveSimulator />
      <BentoGrid />
      <MetricsAudit />
      <ApiConsole />
      <Footer onOpenConsole={onEnterDashboard} />
    </div>
  );
}
