import type { Config } from "tailwindcss";

// Design tokens extracted from the reference UI screenshot (spec §6).
//
// Sampled directly from the reference image:
//   chrome/rail      #012e3c  (dark teal-blue navigation)
//   top bar          #0f1b22  (near-black blue)
//   deeper surface   #01222e
//   cream surfaces   #faf2e2 / #f9f5ee
//   primary emerald  #007755  (active / verified / primary action)
//   sky blue         #88ccff → #aaddff (soft atmospheric secondary)
//   muted slate      #2f6b7d / #446677
//   wood signboard   #512c14
//   financial gold   #d9a441  (important / financial state, spec §6)
//   restrained plum  #7c5cad  (secondary accent, spec §6)
//   failure          #b23a30

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces / chrome
        forest: "#012e3c", // app canvas + navigation rail
        "forest-2": "#01222e", // deeper panels, footers
        "forest-3": "#024457", // raised / hover on chrome
        chrome: "#0f1b22", // top status bar
        cream: "#faf2e2", // main content surface
        parchment: "#f2e9d6", // secondary surface
        parchment2: "#e7dcc3", // wells, tracks
        wood: "#512c14", // pixel signboards / small labels
        // Ink
        ink: "#132029",
        "ink-soft": "#5b6d74",
        // Brand
        leaf: "#007755", // primary action, active, verified
        "leaf-deep": "#015c44",
        "leaf-bright": "#00996b",
        gold: "#d9a441", // financial / important
        "gold-deep": "#b58430",
        teal: "#2f6b7d", // muted teal secondary
        sky: "#88ccff", // soft sky blue
        plum: "#7c5cad", // restrained secondary
        danger: "#b23a30", // failure / destructive only
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', "ui-monospace", "monospace"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        pixel: "3px 3px 0 0 rgba(5, 20, 27, 0.45)",
        "pixel-sm": "2px 2px 0 0 rgba(5, 20, 27, 0.45)",
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
