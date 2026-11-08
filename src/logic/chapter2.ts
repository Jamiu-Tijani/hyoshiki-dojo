/* Chapter 2 judges: lanes (drawn route) and kerb (drawn route with a held stop).
   Ported from js/game.js; route choices are judged exactly like drawn routes. */
import { densify, dwellIn } from "./geometry.ts";
import type { KerbItem, LaneObj, LanesItem, Point, TimedPoint } from "./types.ts";

export type RouteResult = { ok: true; stopAt?: number } | { ok: false; msg: string };
export type RouteChoice<P extends Point = Point> = { label: string; line: P[] };

/* ---------- lanes ---------- */
export const RX0 = 30, RW = 300;
export type LaneGeom = { w: number; cx: (i: number) => number };
export function laneGeom(n: number): LaneGeom { const w = RW / n; return { w, cx: i => RX0 + w * i + w / 2 }; }

export function laneName(s: LanesItem, i: number): string {
  const L = s.lanes[i], ups = s.lanes.filter(l => l.dir === "up").length;
  if (L.dir === "down") return "Oncoming half";
  if (L.paint) return "Bus lane (" + L.paint.replace("バス", "") + ")";
  if (s.lanes.some(l => l.dir === "down")) return "Your half";
  if (ups === 2) return i === 0 ? "Left lane" : "Right lane";
  return ["Left lane", "Middle lane", "Right lane"][i] || `Lane ${i + 1}`;
}
const lc = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
/** Lane name as it reads inside a sentence: "your half", "the right lane". */
export function lanePhrase(s: LanesItem, i: number): string {
  const n = laneName(s, i);
  return n === "Your half" ? "your half" : "the " + lc(n);
}

export type Obstacle = LaneObj & { x0: number; x1: number; y0: number; y1: number; name: string };
export function laneObstacles(s: LanesItem, g: LaneGeom): Obstacle[] {
  return (s.objs || []).filter(o => o.type !== "bus").map(o => {
    const cx = g.cx(o.lane);
    const hw = o.type === "cones" ? g.w / 2 - 4 : o.type === "truck" ? 17 : 15;
    const hh = o.type === "cones" ? 34 : o.type === "truck" ? 44 : 25;
    const name = o.type === "cones" ? "the road works" : o.type === "truck" ? "the truck" : o.type === "oncoming" ? "the oncoming car" : "the car ahead";
    return { ...o, x0: cx - hw - 8, x1: cx + hw + 8, y0: o.y - hh - 6, y1: o.y + hh + 6, name };
  });
}
/** Where your car sits; further up the road when a bus is close behind. */
export function laneHome(s: LanesItem, g: LaneGeom): Point {
  const behind = (s.objs || []).some(o => o.type === "bus" && o.y > 250);
  return { x: g.cx(s.start), y: behind ? 225 : 290 };
}

export type LaneAnalysis = {
  visited: Set<number>; hit: Obstacle | undefined; endLane: number; top: boolean;
  ahead: Obstacle | undefined; via: number | null; offRoad: boolean;
};
export function analyseLanePath(s: LanesItem, g: LaneGeom, home: Point, pts: Point[]): LaneAnalysis {
  const n = s.lanes.length, laneAt = (x: number) => Math.max(0, Math.min(n - 1, Math.floor((x - RX0) / g.w)));
  const obs = laneObstacles(s, g), dense = densify(pts);
  const visited = new Set(dense.map(p => laneAt(p.x)));
  const hit = obs.find(o => dense.some(p => p.x > o.x0 && p.x < o.x1 && p.y > o.y0 && p.y < o.y1));
  const end = pts[pts.length - 1], endLane = laneAt(end.x), top = end.y < 70;
  const ahead = obs.filter(o => o.lane === s.start && o.y < home.y).sort((a, b) => b.y - a.y)[0];
  let via: number | null = null;
  if (ahead) {
    const side = dense.filter(p => p.y < ahead.y1 && p.y > ahead.y0).map(p => laneAt(p.x));
    if (side.length) via = side.every(l => l === side[0]) ? side[0] : -1;
  }
  const offRoad = dense.some(p => p.x < RX0 + 2 || p.x > RX0 + RW - 2);
  return { visited, hit, endLane, top, ahead, via, offRoad };
}

export function judgeLanePath(s: LanesItem, a: LaneAnalysis): RouteResult {
  const sp = s.path, st = s.start, nm = (i: number) => lanePhrase(s, i), vis = [...a.visited];
  const only = (ls: number[]) => vis.every(l => ls.includes(l));
  const crossedOncoming = vis.some(l => s.lanes[l].dir === "down");
  if (a.offRoad) return { ok: false, msg: "Your route left the road." };
  if (a.hit) return { ok: false, msg: `You drove into ${a.hit.name}.` };
  if (sp.stay) {
    if (!a.top) return { ok: false, msg: "You stopped, but nothing blocks you. Draw your route on up the road." };
    if (!only([st])) return { ok: false, msg: crossedOncoming ? "You crossed into the oncoming half." : `You left ${nm(st)}.` };
    return { ok: true };
  }
  if (sp.follow) {
    if (!only([st])) return { ok: false, msg: crossedOncoming ? "You crossed the centre line to get past." : "You changed lanes to get past." };
    if (a.top) return { ok: false, msg: "You drove on through the vehicle ahead." };
    return { ok: true };
  }
  if (sp.pass != null) {
    if (!a.top) return { ok: false, msg: "You waited behind, but here you may pass." };
    if (a.via !== sp.pass) return { ok: false, msg: (a.via ?? 0) > sp.pass /* null compares as 0, as in the old code */ ? "You passed two lanes over. Use the lane immediately to your right." : "Pass on the right-hand side." };
    if (a.endLane !== st) return { ok: false, msg: `After passing, move back into ${nm(st)}.` };
    if (!only([st, sp.pass])) return { ok: false, msg: `Use only ${nm(sp.pass)} to pass.` };
    return { ok: true };
  }
  if (sp.move) {
    const move = sp.move;
    if (!a.top) return { ok: false, msg: "You stopped. Draw your route on up the road." };
    // a lane you start in can't count as "entered"; you may need to leave it
    const banned = vis.find(l => l !== st && ((sp.never || []).includes(l) || (s.lanes[l].paint && !move.includes(l))));
    if (banned != null) return { ok: false, msg: `Your route used ${nm(banned)}.` };
    if (!move.includes(a.endLane)) return { ok: false, msg: `You ended in ${nm(a.endLane)}.` };
    return { ok: true };
  }
  return { ok: false, msg: "This question has no answer set." };
}

/** Convenience: geometry + analysis + verdict for one route. */
export function judgeLaneRoute(s: LanesItem, line: Point[]): RouteResult {
  const g = laneGeom(s.lanes.length);
  return judgeLanePath(s, analyseLanePath(s, g, laneHome(s, g), line));
}

export function laneChoices(s: LanesItem): RouteChoice[] {
  const g = laneGeom(s.lanes.length), home = laneHome(s, g);
  const n = s.lanes.length, sx = g.cx(s.start), y0 = home.y - 25;
  const P = (...xy: [number, number][]) => xy.map(([x, y]) => ({ x, y }));
  const ahead = laneObstacles(s, g).filter(o => o.lane === s.start && o.y < home.y).sort((a, b) => b.y - a.y)[0];
  const out: RouteChoice[] = [];
  out.push(ahead ? { label: "Wait behind", line: P([sx, y0], [sx, ahead.y1 + 18]) }
    : { label: `Stay in ${lanePhrase(s, s.start)}`, line: P([sx, y0], [sx, 30]) });
  for (let L = 0; L < n; L++) if (L !== s.start)
    out.push({ label: `Move to ${lanePhrase(s, L)}`, line: P([sx, y0], [sx, y0 - 30], [g.cx(L), y0 - 80], [g.cx(L), 30]) });
  if (ahead) for (const L of [s.start + 1, s.start + 2]) if (L < n) {
    const x = g.cx(L);
    out.push({ label: `Pass using ${lanePhrase(s, L)}, then move back`, line: P([sx, y0], [sx, ahead.y1 + 30], [x, ahead.y1 - 5], [x, ahead.y0 - 5], [sx, ahead.y0 - 50], [sx, 30]) });
  }
  return out;
}

/* ---------- kerb ---------- */
/* Layout: car park y 0–120, pavement y 120–170, road y 170–360. Driveway x 130–230. */
export const K = { park: 120, walk0: 120, walk1: 170, dx0: 130, dx1: 230, hold: 400 } as const;
export type KerbGeom = { home: Point; front: Point; zone: (p: Point) => boolean; done: (p: Point) => boolean };
export function kerbGeom(into: boolean): KerbGeom {
  return into
    ? { home: { x: 180, y: 300 }, front: { x: 180, y: 275 }, zone: p => p.y >= K.walk1 && p.y <= K.walk1 + 30, done: p => p.y < 100 }
    : { home: { x: 180, y: 60 }, front: { x: 180, y: 85 }, zone: p => p.y >= K.walk0 - 30 && p.y <= K.walk0, done: p => p.y > 215 };
}
export function judgeKerbPath(s: KerbItem, pts: TimedPoint[]): RouteResult {
  const into = s.dir === "in", G = kerbGeom(into), onWalk = (p: Point) => p.y > K.walk0 && p.y < K.walk1;
  const end = pts[pts.length - 1];
  if (!G.done(end)) return { ok: false, msg: into ? "Finish your route into the car park." : "Finish your route out onto the road." };
  if (densify(pts).some(p => onWalk(p) && (p.x < K.dx0 || p.x > K.dx1))) return { ok: false, msg: "Cross the pavement at the driveway." };
  if (dwellIn(pts, G.zone) >= K.hold) return { ok: true, stopAt: pts.findIndex(G.zone) };
  if (dwellIn(pts, onWalk) >= K.hold) return { ok: false, msg: "You stopped on the pavement, blocking it. Stop just before it." };
  return { ok: false, msg: "You crossed the pavement without stopping. Hold your finger still just before the pavement, then carry on." };
}
export function kerbChoices(s: KerbItem): RouteChoice<TimedPoint>[] {
  const into = s.dir === "in", f = kerbGeom(into).front, sgn = into ? -1 : 1;
  const stopY = into ? K.walk1 + 12 : K.walk0 - 12, walkY = (K.walk0 + K.walk1) / 2, endY = into ? 60 : 240;
  const seq = (...ys: [number, number][]) => { let t = 0; return ys.map(([y, dt]) => ({ x: f.x, y, t: (t += dt) })); };
  return [
    { label: into ? "Drive straight in" : "Drive straight out", line: seq([f.y, 0], [stopY, 300], [walkY, 100], [endY, 300]) },
    { label: "Stop just before the pavement, then go", line: seq([f.y, 0], [stopY, 300], [stopY + 0.01 * sgn, 700], [walkY, 300], [endY, 300]) },
    { label: "Stop on the pavement, then go", line: seq([f.y, 0], [stopY, 300], [walkY, 200], [walkY + 0.01 * sgn, 700], [endY, 300]) },
  ];
}
