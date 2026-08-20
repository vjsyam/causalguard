import { motion } from "motion/react";

interface NavbarProps {
  onEnterDashboard: () => void;
  onScrollToSection: (sectionId: string) => void;
}

export function Navbar({ onEnterDashboard, onScrollToSection }: NavbarProps) {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-5 inset-x-0 z-50 max-w-6xl mx-auto px-4 pointer-events-auto"
    >
      <div className="glass-panel rounded-full px-5 py-3 border border-slate-800/80 bg-slate-950/80 backdrop-blur-xl shadow-2xl flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-orange-500/20">
            CG
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              Causal<span className="text-orange-400">Guard</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
                v2.0
              </span>
            </span>
          </div>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
          <button
            onClick={() => onScrollToSection("simulator-section")}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Signal Simulator
          </button>
          <button
            onClick={() => onScrollToSection("dag-section")}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Causal Discovery DAG
          </button>
          <button
            onClick={() => onScrollToSection("methodology-section")}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Methodology
          </button>
          <button
            onClick={() => onScrollToSection("metrics-section")}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Holdout Evaluation
          </button>
          <button
            onClick={() => onScrollToSection("api-section")}
            className="hover:text-white transition-colors cursor-pointer"
          >
            API Docs
          </button>
        </div>

        {/* Action Badge & CTA */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>0.999 ROC-AUC</span>
          </div>

          <button
            onClick={onEnterDashboard}
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-semibold shadow-lg shadow-orange-600/25 transition-all transform hover:scale-[1.03] active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open Risk Console</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
