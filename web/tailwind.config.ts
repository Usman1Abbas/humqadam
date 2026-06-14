import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0d1b2a",
        primary: "#1b9c85",
        primaryDark: "#137a68",
        accent: "#e9c46a",
        sand: "#f6f4ef",
      },
      fontFamily: {
        urdu: ["var(--font-urdu)", "Noto Nastaliq Urdu", "serif"],
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(1)", opacity: "0.7" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
        bar: {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%": { transform: "scaleY(1)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        aurora: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(4%, -3%) scale(1.08)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.04)" },
        },
      },
      animation: {
        pulseRing: "pulseRing 1.6s ease-out infinite",
        bar: "bar 1s ease-in-out infinite",
        fadeUp: "fadeUp 0.6s ease-out both",
        aurora: "aurora 14s ease-in-out infinite",
        breathe: "breathe 3.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
