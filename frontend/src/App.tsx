import { useState } from "react";
import { Hero } from "./components/Hero";
import { Dashboard } from "./components/Dashboard";
import { SplashCursor } from "./components/SplashCursor";

export function App() {
  const [view, setView] = useState<"hero" | "dashboard">("hero");

  return (
    <div className="min-h-screen bg-[#06070a] text-slate-100 selection:bg-orange-500/30 selection:text-orange-200 relative overflow-x-hidden">
      {/* 
        WebGL Fluid Splash Cursor:
        - Enabled on Landing Page for fluid interaction
        - Hidden on Operations Console so data & nodes are 100% focused
      */}
      {view === "hero" && (
        <div className="pointer-events-none fixed inset-0 z-40">
          <SplashCursor
            COLOR="#f97316"
            SPLAT_RADIUS={0.22}
            SPLAT_FORCE={6000}
            DENSITY_DISSIPATION={3.2}
            VELOCITY_DISSIPATION={2.0}
          />
        </div>
      )}

      {view === "dashboard" ? (
        <Dashboard onBackToLanding={() => setView("hero")} />
      ) : (
        <Hero onEnterDashboard={() => setView("dashboard")} />
      )}
    </div>
  );
}

export default App;
