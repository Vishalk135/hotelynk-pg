/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        dusk: {
          DEFAULT: "#0B0E14",
          light: "#131826",
          deep: "#05070B",
        },
        cream: {
          DEFAULT: "#F5F6FA",
          dim: "#E7E9F2",
        },
        mustard: {
          DEFAULT: "#FF9F43",
          dark: "#C2720A",
        },
        azure: {
          DEFAULT: "#22D3EE",
          dark: "#0891B2",
          deep: "#134E5E",
        },
        coral: {
          DEFAULT: "#7C5CFF",
          dark: "#6344E0",
          deep: "#4B32B3",
        },
        moss: {
          DEFAULT: "#34D399",
          dark: "#059669",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        drift: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out both",
        drift: "drift 6s ease-in-out infinite",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "spin-slow": "spin-slow 22s linear infinite",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.2), 0 8px 24px -8px rgba(0,0,0,0.35)",
        card: "0 2px 4px rgba(0,0,0,0.25), 0 16px 40px -12px rgba(0,0,0,0.5)",
        lift: "0 24px 70px -16px rgba(0,0,0,0.65)",
        glow: "0 0 0 1px rgba(124,92,255,0.15), 0 0 40px -4px rgba(124,92,255,0.35)",
      },
    },
  },
  plugins: [],
};

