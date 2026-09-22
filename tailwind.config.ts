import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces
        forest: "#0e1f1a",
        "forest-2": "#14332b",
        "forest-3": "#1b4034",
        cream: "#f7f1e3",
        parchment: "#efe6cf",
        parchment2: "#e6d9bc",
        // Ink
        ink: "#1d2b26",
        "ink-soft": "#51625a",
        // Brand
        leaf: "#2e7d4f",
        "leaf-deep": "#256741",
        "leaf-bright": "#3c9a63",
        gold: "#d9a441",
        "gold-deep": "#b58430",
        teal: "#3e8e83",
        sky: "#7fb4c9",
        plum: "#7c5cad",
        danger: "#c0453a",
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', "ui-monospace", "monospace"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        pixel: "3px 3px 0 0 rgba(20, 51, 43, 0.35)",
        "pixel-sm": "2px 2px 0 0 rgba(20, 51, 43, 0.35)",
        "pixel-gold": "3px 3px 0 0 rgba(181, 132, 48, 0.45)",
      },
      animation: {
        "pulse-soft": "pulseSoft 2.2s ease-in-out infinite",
        blink: "blink 1.1s steps(2, start) infinite",
        "float-y": "floatY 3.4s ease-in-out infinite",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.25" },
        },
        floatY: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
