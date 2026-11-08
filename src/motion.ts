/* Motion values read from tokens.css, so durations and easings are defined in one place.
   Reduced motion: tokens.css sets every --dur-* to 0ms, and <MotionConfig reducedMotion="user"> is the backstop. */
type Bezier = [number, number, number, number];

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** "300ms" | "0.3s" → seconds. */
export function duration(name: `--dur-${string}`): number {
  const v = cssVar(name);
  const n = parseFloat(v);
  if (Number.isNaN(n)) return 0;
  return v.endsWith("ms") ? n / 1000 : n;
}

/** "cubic-bezier(a, b, c, d)" → [a, b, c, d]. */
export function easing(name: `--ease-${string}`): Bezier {
  const m = cssVar(name).match(/cubic-bezier\(([^)]+)\)/);
  const p = m?.[1]?.split(",").map(Number);
  return p && p.length === 4 && p.every(Number.isFinite) ? (p as Bezier) : [0.25, 0.1, 0.25, 1];
}
