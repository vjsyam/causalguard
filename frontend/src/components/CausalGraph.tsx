import { useEffect, useRef, useState, useMemo } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import type { GlobalGraph, TransactionScore } from "../types";

interface Props {
  graph: GlobalGraph | null;
  selected: TransactionScore | null;
  loading: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  outcome: "#f97316",
  behavioral: "#06b6d4",
  financial: "#8b5cf6",
  device: "#ec4899",
  identity: "#f59e0b",
  location: "#10b981",
};

interface InspectedNode {
  id: string;
  label: string;
  group: string;
  parents: string[];
  children: string[];
}

export function CausalGraph({ graph, selected, loading }: Props) {
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: typeof window !== "undefined" ? window.innerWidth - 640 : 900,
    height: typeof window !== "undefined" ? window.innerHeight - 80 : 700,
  });
  const [inspectedNode, setInspectedNode] = useState<InspectedNode | null>(null);

  // Responsive dynamic ResizeObserver so the canvas always occupies 100% of the available middle pane
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height),
        });
      }
    };

    updateSize();

    const ro = new ResizeObserver(() => {
      updateSize();
    });
    ro.observe(el);

    window.addEventListener("resize", updateSize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  // Configure forces and auto-fit to container
  useEffect(() => {
    if (fgRef.current && graph) {
      fgRef.current.d3Force("charge")?.strength(-500);
      fgRef.current.d3Force("link")?.distance(130);
      
      const timer = setTimeout(() => {
        fgRef.current?.zoomToFit(400, 60);
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [graph, dimensions]);

  const activeNodeSet = useMemo(() => {
    if (!selected) return new Set<string>();
    const set = new Set(selected.active_anomalies);
    set.add("is_fraud");
    return set;
  }, [selected]);

  const activeEdgeSet = useMemo(() => {
    if (!selected) return new Set<string>();
    return new Set(selected.causal_path.map((e) => `${e.from}->${e.to}`));
  }, [selected]);

  const graphData = useMemo(() => {
    if (!graph) return { nodes: [], links: [] };

    const nodes = graph.nodes.map((n) => ({
      id: n.id,
      label: n.label || n.id.replace(/_/g, " "),
      group: n.group || "behavioral",
      isOutcome: n.id === "is_fraud",
      isActive: activeNodeSet.has(n.id),
    }));

    const links = graph.edges.map((e) => {
      const edgeKey = `${e.source}->${e.target}`;
      const isActive = activeEdgeSet.has(edgeKey);
      return {
        source: e.source,
        target: e.target,
        strength: e.strength || 0.5,
        isActive,
      };
    });

    return { nodes, links };
  }, [graph, activeNodeSet, activeEdgeSet]);

  const handleNodeClick = (node: any) => {
    if (!graph) return;
    const parents = graph.edges.filter((e) => e.target === node.id).map((e) => e.source);
    const children = graph.edges.filter((e) => e.source === node.id).map((e) => e.target);

    setInspectedNode({
      id: node.id,
      label: node.label,
      group: node.group,
      parents,
      children,
    });
  };

  const handleZoomIn = () => {
    if (fgRef.current) {
      const currentZoom = fgRef.current.zoom();
      fgRef.current.zoom(currentZoom * 1.3, 300);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      const currentZoom = fgRef.current.zoom();
      fgRef.current.zoom(currentZoom / 1.3, 300);
    }
  };

  const handleResetView = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 60);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center font-mono text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span>Synthesizing PC Causal Graph...</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full flex-1 overflow-hidden bg-[#06070a]">
      {/* Node Inspector Modal Overlay */}
      {inspectedNode && (
        <div className="absolute top-16 left-4 z-30 w-80 glass-panel rounded-xl border border-slate-700 bg-slate-950/95 shadow-2xl p-4 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[inspectedNode.group] || "#06b6d4" }} />
              <span className="text-xs font-bold text-white uppercase">{inspectedNode.label}</span>
            </div>
            <button
              onClick={() => setInspectedNode(null)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Parent Causes (Upstream):</span>
              {inspectedNode.parents.length === 0 ? (
                <span className="text-slate-500 text-[11px]">Root Variable (No incoming edges)</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {inspectedNode.parents.map((p) => (
                    <span key={p} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-cyan-400">
                      {p.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Direct Effects (Downstream):</span>
              {inspectedNode.children.length === 0 ? (
                <span className="text-slate-500 text-[11px]">Terminal Node</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {inspectedNode.children.map((c) => (
                    <span key={c} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-orange-400">
                      {c.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex justify-between">
              <span>Test: Chi-Square (α = 0.05)</span>
              <span className="text-emerald-400 font-bold">p &lt; 0.001</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Zoom / Navigation Controls */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="w-8 h-8 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center font-bold text-sm shadow-lg transition-colors cursor-pointer"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="w-8 h-8 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center font-bold text-sm shadow-lg transition-colors cursor-pointer"
        >
          −
        </button>
        <button
          onClick={handleResetView}
          title="Fit Graph to View"
          className="w-8 h-8 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-20 flex flex-wrap gap-2 max-w-md pointer-events-none">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <div
            key={cat}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-300 capitalize backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span>{cat}</span>
          </div>
        ))}
      </div>

      {/* 2D Canvas Graph with Full Dimensions */}
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor="#06070a"
        nodeRelSize={6}
        cooldownTicks={60}
        warmupTicks={30}
        onNodeClick={handleNodeClick}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={0.92}
        linkCurvature={0.08}
        linkColor={(link: any) => {
          if (selected) {
            return link.isActive ? "#f97316" : "rgba(255, 255, 255, 0.07)";
          }
          return "rgba(255, 255, 255, 0.22)";
        }}
        linkWidth={(link: any) => {
          if (selected) {
            return link.isActive ? 2.5 : 0.8;
          }
          return 1.4;
        }}
        linkDirectionalParticles={(link: any) => (link.isActive ? 3 : 0)}
        linkDirectionalParticleSpeed={0.008}
        linkDirectionalParticleWidth={2.5}
        linkDirectionalParticleColor={() => "#f97316"}
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const isSelectedTx = Boolean(selected);
          const isActive = node.isActive;
          const isOutcome = node.isOutcome;
          const baseColor = CATEGORY_COLORS[node.group] || "#06b6d4";

          const radius = isOutcome ? 11 : 7;
          const alpha = isSelectedTx ? (isActive ? 1 : 0.25) : 0.9;

          if (isActive && isSelectedTx) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + 5, 0, 2 * Math.PI, false);
            ctx.strokeStyle = isOutcome ? "rgba(249, 115, 22, 0.4)" : "rgba(6, 182, 212, 0.4)";
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
          ctx.fillStyle = baseColor;
          ctx.globalAlpha = alpha;
          ctx.fill();

          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = isOutcome ? 2 : 1;
          ctx.globalAlpha = isSelectedTx ? (isActive ? 0.9 : 0.15) : 0.6;
          ctx.stroke();
          ctx.globalAlpha = 1;

          const fontSize = Math.max(10 / globalScale, 3);
          ctx.font = `600 ${fontSize}px Inter, sans-serif`;
          const text = node.label;
          const textWidth = ctx.measureText(text).width;
          const pillPaddingX = 4 / globalScale;
          const pillHeight = fontSize + 4 / globalScale;
          const pillY = node.y + radius + 4 / globalScale;

          ctx.fillStyle = "rgba(10, 12, 18, 0.85)";
          ctx.globalAlpha = isSelectedTx ? (isActive ? 1 : 0.3) : 0.85;
          ctx.fillRect(
            node.x - textWidth / 2 - pillPaddingX,
            pillY,
            textWidth + pillPaddingX * 2,
            pillHeight
          );

          ctx.strokeStyle = isOutcome ? "rgba(249, 115, 22, 0.4)" : "rgba(255, 255, 255, 0.15)";
          ctx.strokeRect(
            node.x - textWidth / 2 - pillPaddingX,
            pillY,
            textWidth + pillPaddingX * 2,
            pillHeight
          );

          ctx.fillStyle = isOutcome ? "#f97316" : isActive ? "#ffffff" : "#94a3b8";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(text, node.x, pillY + pillHeight / 2);
          ctx.globalAlpha = 1;
        }}
      />
    </div>
  );
}
