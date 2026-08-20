import { motion } from "motion/react";

// Spatially distributed across a wide 1000 x 500 coordinate space
const NODES = [
  // Column 1: Root Device & Identity
  { id: "device", label: "Device Anomaly", cx: 120, cy: 150, color: "#ec4899", cat: "Device" },
  { id: "email", label: "Disposable Email", cx: 120, cy: 370, color: "#f59e0b", cat: "Identity" },

  // Column 2: Geographic & Location
  { id: "distance", label: "Geo-Distance Jump", cx: 340, cy: 260, color: "#10b981", cat: "Location" },
  { id: "card_addr", label: "Address Mismatch", cx: 340, cy: 420, color: "#10b981", cat: "Location" },

  // Column 3: Velocity & Counters
  { id: "velocity", label: "Velocity (1 Hour)", cx: 560, cy: 130, color: "#06b6d4", cat: "Behavioral" },
  { id: "velocity24", label: "Velocity (24 Hours)", cx: 560, cy: 270, color: "#06b6d4", cat: "Behavioral" },
  { id: "counter", label: "C-Counter Surge", cx: 560, cy: 410, color: "#06b6d4", cat: "Behavioral" },

  // Column 4: Financial & Product
  { id: "amount", label: "Amount Outlier (>2.5σ)", cx: 750, cy: 170, color: "#8b5cf6", cat: "Financial" },
  { id: "product", label: "High-Risk Product", cx: 750, cy: 350, color: "#06b6d4", cat: "Behavioral" },

  // Column 5: Fraud Outcome
  { id: "fraud", label: "Fraud Spike", cx: 900, cy: 260, color: "#f97316", big: true, cat: "Outcome" },
];

const EDGES = [
  { from: "device", to: "velocity", delay: 0.1 },
  { from: "device", to: "distance", delay: 0.2 },
  { from: "distance", to: "card_addr", delay: 0.3 },
  { from: "velocity", to: "velocity24", delay: 0.25 },
  { from: "velocity", to: "fraud", delay: 0.4 },
  { from: "velocity24", to: "fraud", delay: 0.5 },
  { from: "amount", to: "fraud", delay: 0.6 },
  { from: "email", to: "fraud", delay: 0.7 },
  { from: "distance", to: "fraud", delay: 0.65 },
  { from: "card_addr", to: "fraud", delay: 0.75 },
  { from: "counter", to: "fraud", delay: 0.8 },
  { from: "product", to: "fraud", delay: 0.85 },
];

function getNode(id: string) {
  return NODES.find((n) => n.id === id)!;
}

export function AnimatedCausalGraph() {
  return (
    <div className="relative w-full h-full select-none flex items-center justify-center p-4" aria-hidden>
      <svg
        viewBox="0 0 1000 520"
        className="w-full h-full max-h-[440px]"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible" }}
      >
        <defs>
          <marker id="arr-orange-lg" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,1 L0,7 L7,4 z" fill="#f97316" opacity="0.85" />
          </marker>
          <marker id="arr-cyan-lg" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,1 L0,7 L7,4 z" fill="#06b6d4" opacity="0.75" />
          </marker>
          <filter id="glow-fraud-lg" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Directed Edges */}
        {EDGES.map((e, i) => {
          const a = getNode(e.from);
          const b = getNode(e.to);
          const isToFraud = e.to === "fraud";
          return (
            <motion.line
              key={i}
              x1={a.cx}
              y1={a.cy}
              x2={b.cx}
              y2={b.cy}
              stroke={isToFraud ? "#f97316" : "rgba(6, 182, 212, 0.5)"}
              strokeWidth={isToFraud ? 2 : 1.4}
              strokeOpacity={isToFraud ? 0.85 : 0.5}
              strokeLinecap="round"
              markerEnd={isToFraud ? "url(#arr-orange-lg)" : "url(#arr-cyan-lg)"}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: e.delay + 0.2, duration: 0.9, ease: "easeOut" }}
            />
          );
        })}

        {/* Nodes */}
        {NODES.map((n, i) => {
          const isFraud = n.big;
          const r = isFraud ? 22 : 14;

          return (
            <g key={n.id}>
              {/* Outer Pulse for Outcome Node */}
              {isFraud && (
                <motion.circle
                  cx={n.cx}
                  cy={n.cy}
                  r={32}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth={1.5}
                  strokeOpacity={0.4}
                  animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.15, 0.5] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
                />
              )}

              {/* Main Node Circle */}
              <motion.circle
                cx={n.cx}
                cy={n.cy}
                r={r}
                fill={n.color}
                filter={isFraud ? "url(#glow-fraud-lg)" : undefined}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.06, type: "spring", damping: 14, stiffness: 200 }}
                style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
                stroke="#ffffff"
                strokeWidth={isFraud ? 2.5 : 1.5}
                strokeOpacity={0.8}
              />

              {/* Node Label Pill Background */}
              <rect
                x={n.cx - 65}
                y={n.cy + r + 6}
                width={130}
                height={20}
                rx={5}
                fill="rgba(10, 12, 18, 0.9)"
                stroke={isFraud ? "rgba(249, 115, 22, 0.4)" : "rgba(255, 255, 255, 0.12)"}
                strokeWidth={1}
              />

              {/* Node Text */}
              <text
                x={n.cx}
                y={n.cy + r + 20}
                textAnchor="middle"
                fontSize={isFraud ? 12 : 10.5}
                fill={isFraud ? "#f97316" : "#f1f5f9"}
                fontWeight={isFraud ? "bold" : "600"}
                fontFamily="Inter, sans-serif"
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
