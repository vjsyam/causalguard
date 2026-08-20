interface FooterProps {
  onOpenConsole?: () => void;
}

export function Footer({ onOpenConsole }: FooterProps) {
  return (
    <footer className="w-full border-t border-slate-800 bg-slate-950/90 py-14 px-4 md:px-8 mt-20 z-10 relative backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-orange-500/20">
            CG
          </div>
          <div>
            <span className="text-sm font-bold text-white tracking-tight">CausalGuard Risk Intelligence</span>
            <p className="text-xs text-slate-400 mt-0.5">Constraint-Based Causal Discovery for High-Throughput Fintech</p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-400 font-mono">
          <span>PC-Algorithm (α=0.05)</span>
          <span>•</span>
          <span>N=30,000 Holdout</span>
          <span>•</span>
          <span>$15 FP / $120 FN Loss Model</span>
        </div>

        {onOpenConsole && (
          <button
            onClick={onOpenConsole}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-orange-400 hover:text-white transition-colors cursor-pointer"
          >
            Launch Operations Console →
          </button>
        )}
      </div>
    </footer>
  );
}
