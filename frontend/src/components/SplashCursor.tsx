import { useEffect, useState } from "react";

export function SplashCursor() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [trail, setTrail] = useState<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let rafId: number;

    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      
      // Smooth lerp trailing dot
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setTrail((prev) => {
          if (!prev) return { x: e.clientX, y: e.clientY };
          return {
            x: prev.x + (e.clientX - prev.x) * 0.35,
            y: prev.y + (e.clientY - prev.y) * 0.35,
          };
        });
      });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest("button, a, input, [role='button'], .cursor-pointer")) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseover", handleMouseOver, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!pos) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {/* Outer Glow Halo */}
      <div
        className="absolute rounded-full transition-transform duration-75 ease-out pointer-events-none"
        style={{
          transform: `translate3d(${pos.x - 24}px, ${pos.y - 24}px, 0) scale(${isHovered ? 1.5 : 1})`,
          width: 48,
          height: 48,
          background: isHovered
            ? "radial-gradient(circle, rgba(249,115,22,0.3) 0%, rgba(6,182,212,0) 70%)"
            : "radial-gradient(circle, rgba(249,115,22,0.18) 0%, rgba(249,115,22,0) 70%)",
          willChange: "transform",
        }}
      />

      {/* Trailing Soft Dot */}
      {trail && (
        <div
          className="absolute w-3 h-3 rounded-full bg-cyan-400/40 blur-[1px] pointer-events-none transition-transform duration-100 ease-out"
          style={{
            transform: `translate3d(${trail.x - 6}px, ${trail.y - 6}px, 0)`,
            willChange: "transform",
          }}
        />
      )}

      {/* Center Precise Core Dot */}
      <div
        className="absolute w-2 h-2 rounded-full bg-orange-500 shadow-sm shadow-orange-500/80 pointer-events-none"
        style={{
          transform: `translate3d(${pos.x - 4}px, ${pos.y - 4}px, 0)`,
          willChange: "transform",
        }}
      />
    </div>
  );
}

export default SplashCursor;
