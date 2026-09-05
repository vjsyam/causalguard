export function SparkleCanvas() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
      {/* Ambient Grid Mesh */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#f97316 1px, transparent 1px), linear-gradient(to right, #f97316 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />

      {/* Soft Ambient Radial Lights */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px]" />
      <div className="absolute top-96 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[140px]" />
      <div className="absolute bottom-40 left-1/3 w-[500px] h-[300px] bg-purple-600/5 rounded-full blur-[160px]" />
    </div>
  );
}
