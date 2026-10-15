/**
 * Polaris v3.2 "Glass" tokens. Source of truth: docs/DESIGN.md.
 *
 * Dark only. Colour carries meaning only: green gains, red losses and
 * destructive actions, amber stale or delayed data, blue paper (simulated)
 * money. Controls are sharp (2px); glass surfaces are soft (12/16/20px). Only
 * overlays cast a shadow. Glass itself lives in globals.css (glass-* classes).
 */
const ink0 = "#0B0B0C";
const ink1 = "#141414";
const ink2 = "#1C1C1C";
const ink3 = "#242424";
const line = "#2A2A2A";
const lineStrong = "#3A3A3A";
const control = "#7A7A7A"; // 3:1 on ink-0 and on the brightest card sheen
const fg = "#F5F5F5";
const fg2 = "#B5B5B5";
const fg3 = "#A0A0A0"; // 5.3:1 on the brightest card sheen
const green = "#3DD68C";
const red = "#FF7A75";
const amber = "#E8B04A";
const blue = "#86B7FF"; // paper money only

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Replace, not extend: only these radii exist. Controls sharp, glass soft.
    borderRadius: {
      none: "0", sm: "2px", DEFAULT: "4px", md: "4px", lg: "12px",
      xl: "16px", "2xl": "20px", "3xl": "20px", full: "9999px",
    },
    // Only overlays cast a shadow. Everything else maps to none.
    boxShadow: {
      none: "none", sm: "none", DEFAULT: "none", md: "none", lg: "none",
      xl: "none", "2xl": "none", inner: "none", card: "none",
      glowGreen: "none", glowRed: "none",
      overlay: "0 24px 48px -12px rgb(0 0 0 / 0.65)",
    },
    screens: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1440px" },
    extend: {
      colors: {
        ink: { 0: ink0, 1: ink1, 2: ink2, 3: ink3 },
        line: { DEFAULT: line, strong: lineStrong },
        control,
        fg: { DEFAULT: fg, 2: fg2, 3: fg3 },
        up: green,
        down: red,
        warn: amber,
        paper: blue,

      },
      fontFamily: {
        sans: ['"Helvetica Neue"', "Helvetica", "Arial", "sans-serif"],
        // Same stack as the UI. Coolvetica was dropped: its free licence
        // excludes web embedding, and relying on a local install rendered a
        // faux bold on machines that had it and Arial on those that didn't.
        display: ['"Helvetica Neue"', "Helvetica", "Arial", "sans-serif"],
        // No monospace face in v2: numbers use tabular figures of the UI face.
        mono: ['"Helvetica Neue"', "Helvetica", "Arial", "sans-serif"],
      },
      fontSize: {
        caption: ["12px", "16px"],
        table: ["13px", "18px"],
        "body-sm": ["14px", "20px"],
        body: ["16px", "24px"],
        h4: ["20px", "28px"],
        h3: ["24px", "32px"],
        h2: ["32px", "36px"],
        h1: ["48px", { lineHeight: "52px", letterSpacing: "-0.02em", fontWeight: "400" }],
        display: ["72px", { lineHeight: "72px", letterSpacing: "-0.035em", fontWeight: "400" }],
        "display-xl": ["clamp(56px, 8vw, 120px)", { lineHeight: "0.95", letterSpacing: "-0.035em", fontWeight: "400" }],
        figure: ["40px", { lineHeight: "44px", letterSpacing: "-0.02em", fontWeight: "500" }],
        micro: ["11px", { lineHeight: "14px", letterSpacing: "0.06em", fontWeight: "500" }],
      },
      transitionDuration: { fast: "120ms", base: "200ms", slow: "320ms" },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.2, 0, 0, 1)",
        exit: "cubic-bezier(0.4, 0, 1, 1)",
      },
      keyframes: {
        tickUp: { "0%": { color: green }, "100%": { color: "inherit" } },
        tickDown: { "0%": { color: red }, "100%": { color: "inherit" } },
        pulseSoft: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.5" } },
      },
      animation: {
        "tick-up": "tickUp 600ms ease-out",
        "tick-down": "tickDown 600ms ease-out",
        "pulse-soft": "pulseSoft 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
