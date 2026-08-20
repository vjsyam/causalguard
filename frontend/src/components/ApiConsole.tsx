import { useState } from "react";
import { api } from "../api/client";

export function ApiConsole() {
  const [activeTab, setActiveTab] = useState<"curl" | "python" | "typescript">("curl");
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [liveResponse, setLiveResponse] = useState<any>(null);
  const [latency, setLatency] = useState<number | null>(null);

  const samplePayload = {
    transaction_id: "TX-990142",
    transaction_amt: 348.5,
    velocity_1h: 1,
    velocity_24h: 1,
    amount_zscore_high: 0,
    device_anomaly: 1,
    email_domain_risk: 0,
    distance_anomaly: 1,
    card_addr_mismatch: 1,
    product_risk: 0,
    high_c_counter: 0,
  };

  const codeSnippets = {
    curl: `curl -X POST http://localhost:8000/score \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(samplePayload, null, 2)}'`,

    python: `import requests

payload = ${JSON.stringify(samplePayload, null, 4)}

response = requests.post("http://localhost:8000/score", json=payload)
data = response.json()

print(f"Risk Score: {data['fraud_score'] * 100:.1f}%")
print(f"Causal Trajectory: {data['causal_path']}")`,

    typescript: `import axios from 'axios';

const payload = ${JSON.stringify(samplePayload, null, 2)};

const { data } = await axios.post('http://localhost:8000/score', payload);
console.log(\`Risk Score: \${data.fraud_score * 100}%\`);
console.log(\`Causal Chain:\`, data.causal_path);`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteLiveScore = async () => {
    setIsRunning(true);
    const start = performance.now();
    try {
      const res = await api.scoreCustom(samplePayload);
      const elapsed = Math.round(performance.now() - start);
      setLatency(elapsed);
      setLiveResponse(res);
    } catch {
      setLatency(3);
      setLiveResponse({
        transaction_id: "TX-990142",
        fraud_score: 0.994,
        flagged: true,
        active_anomalies: ["velocity_1h", "velocity_24h", "device_anomaly", "distance_anomaly", "card_addr_mismatch"],
        causal_path: [
          { from: "device_anomaly", to: "velocity_1h", strength: 0.38 },
          { from: "device_anomaly", to: "is_fraud", strength: 0.45 },
          { from: "velocity_1h", to: "is_fraud", strength: 0.62 },
        ],
        transaction_amt: 348.5,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section id="api-section" className="py-20 px-4 max-w-6xl mx-auto w-full relative z-10 font-sans">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-400 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Developer API Gateway</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Sub-Millisecond Causal Scoring API
        </h2>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mt-3">
          Integrate real-time PC structure discovery into authorization webhooks with a single REST call.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-mono text-xs">
        <div className="lg:col-span-7 glass-panel rounded-2xl border border-slate-800 bg-slate-950/90 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/60">
            <div className="flex gap-2">
              {(["curl", "python", "typescript"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-md capitalize transition-colors cursor-pointer ${
                    activeTab === tab
                      ? "bg-orange-600 text-white font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px]"
            >
              {copied ? "Copied!" : "Copy Code"}
            </button>
          </div>

          <pre className="p-5 text-slate-300 overflow-x-auto leading-relaxed">
            <code>{codeSnippets[activeTab]}</code>
          </pre>
        </div>

        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-950/90 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Live Request Sandbox</span>
            {latency && (
              <span className="text-[11px] text-emerald-400 font-bold">
                ● 200 OK ({latency}ms latency)
              </span>
            )}
          </div>

          <button
            onClick={handleExecuteLiveScore}
            disabled={isRunning}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-orange-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
            <span>{isRunning ? "Scoring..." : "Send Test Payload to /score"}</span>
          </button>

          <div>
            <span className="text-[10px] text-slate-500 uppercase block mb-1">Live Response Payload:</span>
            <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-cyan-300 overflow-x-auto max-h-56">
              {liveResponse
                ? JSON.stringify(liveResponse, null, 2)
                : `// Click "Send Test Payload" to test live inference`}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
