import type { Point, TimedPoint } from "./types.ts";

/* Scene coordinates use a 360 × 360 viewBox throughout. */

/** Intersection geometry for Chapter 1 scenes (was `G` in js/render.js). */
export const G = {
  box: { x0: 120, x1: 240, y0: 60, y1: 180 },
  cwS: { y0: 188, y1: 212 },
  stopY: 222,
  start: { x: 150, y: 318 },
} as const;

/** Longest time (ms) a route stayed inside a zone without leaving it. */
export function dwellIn(pts: TimedPoint[], inZone: (p: Point) => boolean): number {
  let best = 0, run = 0;
  for (let i = 1; i < pts.length; i++) {
    if (inZone(pts[i]) && inZone(pts[i - 1])) { run += pts[i].t - pts[i - 1].t; best = Math.max(best, run); }
    else run = 0;
  }
  return best;
}

/** Points every ~4 units so a quick stroke can't jump over an obstacle. */
export function densify<P extends Point>(pts: P[]): Point[] {
  const d: Point[] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], k = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4));
    for (let j = 0; j < k; j++) d.push({ x: a.x + (b.x - a.x) * j / k, y: a.y + (b.y - a.y) * j / k });
  }
  d.push(pts[pts.length - 1]);
  return d;
}

/** Freehand input gate: a stroke shorter than this is discarded (was inside pathInput). */
export function isUsableStroke(pts: Point[]): boolean {
  if (pts.length < 4) return false;
  const far = Math.max(...pts.map(q => Math.hypot(q.x - pts[0].x, q.y - pts[0].y)));
  return far >= 20;
}
