/**
 * Flint OS v2 tokens. Source of truth: docs/flint-os-v2/DESIGN.md, section 6.
 *
 * Dark only. One accent (candle green); red only for losses and destructive
 * actions; amber only for stale or delayed data. Corners are 2px and nothing
 * casts a shadow: elevation is the ink steps plus a hairline.
 *
 * The legacy names (bgPrimary, textSecondary, accentGreen...) are kept as
 * aliases so components not yet rebuilt render in the new identity. The
 * off-brand hues (blue, purple, cyan) collapse to neutral text colours.
 */
const ink0 = "#0A0B0B";
const ink1 = "#111312";
const ink2 = "#181B1A";
const line = "#242927";
const lineStrong = "#353C39";
const control = "#626A66"; // 3:1 against every ink step: inputs and controls
const fg = "#F2F4F3";
const fg2 = "#A4ACA8";
const fg3 = "#848C88";
const green = "#2FBF71";
const red = "#E5484D";
const amber = "#D9A23A";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Replace, not extend: every rounded-* in the codebase becomes sharp.
    borderRadius: {
      none: "0", sm: "2px", DEFAULT: "2px", md: "2px", lg: "2px",
      xl: "2px", "2xl": "2px", "3xl": "2px", full: "9999px",
    },
    // No drop shadows anywhere.
    boxShadow: {
      none: "none", sm: "none", DEFAULT: "none", md: "none", lg: "none",
      xl: "none", "2xl": "none", inner: "none", card: "none",
      glowGreen: "none", glowRed: "none",
    },
    screens: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1440px" },
    extend: {
      colors: {
        ink: { 0: ink0, 1: ink1, 2: ink2 },
        line: { DEFAULT: line, strong: lineStrong },
        control,
        fg: { DEFAULT: fg, 2: fg2, 3: fg3 },
        up: green,
        down: red,
        warn: amber,

        // Legacy aliases, remapped.
        bgPrimary: ink0,
        bgSecondary: ink1,
        bgElevated: ink2,
        accentGreen: green,
        accentRed: red,
        accentAmber: amber,
        accentBlue: fg2,
        accentPurple: fg2,
        accentCyan: fg2,
        textPrimary: fg,
        textSecondary: fg2,
        textMuted: fg3,
        borderSubtle: line,
        borderStrong: lineStrong,
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
        h1: ["48px", "52px"],
        display: ["72px", "72px"],
      },
      transitionDuration: { fast: "120ms", base: "200ms" },
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
