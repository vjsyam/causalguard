import { motion } from 'motion/react';

const NODES = ['velocity_1h', 'amount_zscore', 'device_anomaly', 'email_risk', 'is_fraud'];

export function LoadingSequence({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 h-full min-h-[320px]">
      {/* Animated nodes fading in one by one */}
      <div className="flex items-center gap-3">
        {NODES.map((node, i) => (
          <motion.div
            key={node}
            className="w-3 h-3 rounded-full"
            style={{ background: node === 'is_fraud' ? '#f97316' : '#06b6d4' }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 1, 0.6], scale: [0.4, 1.2, 1] }}
            transition={{
              delay: i * 0.18,
              duration: 0.5,
              repeat: Infinity,
              repeatDelay: NODES.length * 0.18 + 0.4,
              ease: 'easeOut',
            }}
          />
        ))}
        {/* Connecting lines */}
        {NODES.slice(0, -1).map((_, i) => (
          <motion.div
            key={`line-${i}`}
            className="h-px w-6 bg-gradient-to-r from-safe/40 to-safe/10 -mx-2 -mt-0.5"
            style={{ position: 'relative', zIndex: 0 }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: i * 0.18 + 0.08, duration: 0.3 }}
          />
        ))}
      </div>
      <motion.p
        className="text-muted text-sm tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {label ?? 'Loading causal intelligence…'}
      </motion.p>
    </div>
  );
}
