/** Resolves a design token (a CSS custom property on :root, see globals.css)
 *  to its colour value. For canvas consumers (lightweight-charts, the drawing
 *  overlay) that can't take `var()`. Client-only: call it in effects/handlers. */
export function cssVar(name: `--${string}`): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** A token at a given opacity, for DOM styles (`color-mix` takes `var()`). */
export function tint(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}
