/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:      "#0a0b0f",
        panel:   "#12141a",
        border:  "#1e2028",
        danger:  "#f97316",
        safe:    "#06b6d4",
        muted:   "#6b7280",
        text:    "#e2e8f0",
        dim:     "#94a3b8",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in":    "fadeIn 0.4s ease forwards",
        "glow":       "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        glow:   { from: { boxShadow: "0 0 8px #f97316" }, to: { boxShadow: "0 0 24px #f97316, 0 0 48px #f9731640" } },
      },
    },
  },
  plugins: [],
};
