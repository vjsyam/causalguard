import { useState } from "react";
import { Hero } from "./components/Hero";
import { Dashboard } from "./components/Dashboard";
import { SplashCursor } from "./components/SplashCursor";

type AppView = "hero" | "dashboard" | "404";

export function App() {
  const [view, setView] = useState<AppView>("hero");

  return (
    <div className="min-h-screen bg-[#06070a] text-slate-100 selection:bg-orange-500/30 selection:text-orange-200 relative overflow-x-hidden">
      {/* Zero-Lag Hardware-Accelerated Custom Cursor Glow */}
      {view === "hero" && <SplashCursor />}

      {view === "dashboard" ? (
        <Dashboard onBackToLanding={() => setView("hero")} />
      ) : view === "404" ? (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 font-mono">
          <div className="text-6xl font-black text-orange-500 mb-2">404</div>
          <h1 className="text-xl font-bold text-white mb-2">Resource Not Found</h1>
          <p className="text-slate-400 text-xs max-w-sm mb-6">
            The requested risk route or transaction partition does not exist in the causal graph directory.
          </p>
          <button
            onClick={() => setView("hero")}
            className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-orange-400 hover:text-white transition-colors cursor-pointer"
          >
            ← Return to CausalGuard Overview
          </button>
        </div>
      ) : (
        <Hero onEnterDashboard={() => setView("dashboard")} />
      )}
    </div>
  );
}

export default App;
