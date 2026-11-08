/* Chapter 1 judges: sort, plate, signal, stoppos, bans, approach, tf.
   Ported line for line from js/game.js; the explanation strings are byte-identical
   (tests/logic compares them against the old code's output). */
import { G } from "./geometry.ts";
import type {
  ApproachItem, BanMove, BansItem, Kb, PlateItem, Point, RuleRef, SignKind, SignalItem,
  SignalMove, StopItem, TFItem, TimedPoint, Verdict,
} from "./types.ts";

export type JudgedVerdict = Verdict & { rule: RuleRef };

/* ---------- 1.1 sort ---------- */
export const CAT: Record<SignKind, [string, string]> = {
  kisei: ["規制標識", "Regulatory"], shiji: ["指示標識", "Instruction"],
  keikai: ["警戒標識", "Warning"], annai: ["案内標識", "Guide"],
};
export type SignMeta = { jp: string; en: string; cat: SignKind };

export function judgeSort(sign: SignMeta, chosen: SignKind, kb: Kb): JudgedVerdict {
  const ok = chosen === sign.cat;
  const why = `<b>${sign.jp}</b> · ${sign.en}. ${ok ? "" : `It is a <b>${CAT[sign.cat][0]}</b> (${CAT[sign.cat][1].toLowerCase()} sign). `}${kb.rules["sign.kind." + sign.cat].en}`;
  return { ok, why, rule: ["sign.kinds", "sign.kind." + sign.cat] };
}

/* ---------- 1.2 plates ---------- */
export type PlateZone = "north" | "east";
export const PLATE_ZONES: Record<PlateZone, { x: number; y: number; w: number; h: number; label: string }> = {
  north: { x: 150, y: 6, w: 60, h: 104, label: "Enter" },
  east: { x: 250, y: 152, w: 104, h: 38, label: "Turn right" },
};
export function plateZoneAt(p: Point): PlateZone | null {
  for (const z of Object.keys(PLATE_ZONES) as PlateZone[]) {
    const Z = PLATE_ZONES[z];
    if (p.x >= Z.x && p.x <= Z.x + Z.w && p.y >= Z.y && p.y <= Z.y + Z.h) return z;
  }
  return null;
}
export function judgePlate(s: PlateItem, zone: PlateZone): JudgedVerdict {
  return { ok: zone === s.ok, why: s.why, rule: s.rule };
}

/* ---------- 1.3 signals ---------- */
export const GOAL_WORDS = { left: "turn left", right: "turn right", straight: "go straight" } as const;
export const SIGNAL_WORDS = {
  green: "青 (green)", yellow: "黄 (yellow)", red: "赤 (red)",
  fy: "黄の点滅 (flashing yellow)", fr: "赤の点滅 (flashing red)",
} as const;

export type SignalPath = { kind: "stop" } | { kind: "unclear" } | { kind: Exclude<SignalMove, "stop">; lane: boolean };

/** Reads a drawn route: where it ends, whether it ends in the correct (left-hand) lane, and whether it held at the line. */
export function classifySignalPath(pts: TimedPoint[]): SignalPath {
  const end = pts[pts.length - 1];
  const inStop = (p: Point) => p.x >= 114 && p.x <= 186 && p.y >= 200 && p.y <= 272;
  let dwell = 0, run = 0;
  for (let i = 1; i < pts.length; i++) {
    if (inStop(pts[i]) && inStop(pts[i - 1])) { run += pts[i].t - pts[i - 1].t; dwell = Math.max(dwell, run); }
    else run = 0;
  }
  if (inStop(end)) return { kind: "stop" };
  let kind: "left" | "right" | "straight" | "stopgo" | null = null, lane = true;
  if (end.x < 112) { kind = "left"; lane = end.y >= 116 && end.y <= 186; }
  else if (end.x > 248) { kind = "right"; lane = end.y >= 54 && end.y <= 124; }
  else if (end.y < 58) { kind = "straight"; lane = end.x >= 114 && end.x <= 186; }
  if (!kind) return { kind: "unclear" };
  if (kind === "straight" && dwell >= 450) kind = "stopgo";
  return { kind, lane };
}

/** Tap-to-choose routes (when drawing isn't possible); each is judged as already classified, in lane. */
export const SIGNAL_CHOICES: { kind: SignalMove; label: string; line: Point[] }[] = (() => {
  const lanes: Record<SignalMove, [number, number][]> = {
    left: [[150, 240], [150, 160], [60, 150]], right: [[150, 240], [160, 120], [300, 90]],
    straight: [[150, 240], [150, 20]], stopgo: [[150, 240], [150, 20]], stop: [[150, 246]],
  };
  const label = (k: SignalMove) => k === "stop" ? "Stop at line" : k === "stopgo" ? "Stop, then straight"
    : GOAL_WORDS[k].replace(/^\w/, c => c.toUpperCase());
  return (["left", "straight", "right", "stop", "stopgo"] as SignalMove[]).map(kind => ({
    kind, label: label(kind),
    line: [{ x: G.start.x, y: G.start.y - 25 }, ...lanes[kind].map(([x, y]) => ({ x, y }))],
  }));
})();

/** `null` means the route was unclear: show the hint, record nothing. */
export function judgeSignal(s: SignalItem, res: SignalPath): JudgedVerdict | null {
  if (res.kind === "unclear") return null;
  let ok = s.ok.includes(res.kind), why = s.why;
  if (ok && "lane" in res && res.lane === false) {
    ok = false;
    why = `You ended in the lane for oncoming traffic. In Japan you keep left, so after the turn you join the left-hand lane. ` + why;
  } else if (!ok && res.kind === "straight" && s.ok.includes("stopgo")) why = "You went straight without stopping. " + why;
  else if (!ok && res.kind === "stop" && s.ok.includes("stopgo")) why = "Stopping is right, but you may then continue. " + why;
  return { ok, why, rule: s.rule };
}

/* ---------- 1.4 stop position ---------- */
/** Car centre y is clamped to this range when dragged; the front of the car is 25 above centre. */
export const STOP_CAR_Y = { min: 150, max: 330 } as const;
export function judgeStop(s: StopItem, front: number): JudgedVerdict {
  const lo = s.frontMin, hi = s.frontMin + 28;
  const ok = front >= lo && front <= hi;
  let why = s.why;
  if (front < lo) {
    if (front < G.box.y1) why = "The front of the car is inside the intersection. " + why;
    else if (s.cross && front < G.cwS.y1) why = "The front of the car is on the crosswalk. " + why;
    else why = "You went past the stop position. " + why;
  } else if (front > hi) why = "You stopped well short. Pull up to just before the stop position. " + why;
  return { ok, why, rule: s.rule };
}

/* ---------- 1.5 bans ---------- */
export const MOVE_LABELS: Record<BanMove, string> = {
  straight: "Go straight", left: "Turn left", right: "Turn right", uturn: "U-turn",
  park: "Park 駐車", stop: "Stop 停車",
};
export function judgeBans(s: BansItem, selected: Iterable<BanMove>): JudgedVerdict {
  const sel = new Set(selected), want = new Set(s.banned);
  const missed = [...want].filter(k => !sel.has(k)), extra = [...sel].filter(k => !want.has(k));
  const ok = !missed.length && !extra.length;
  let why = s.why;
  if (!ok) {
    const parts: string[] = [];
    if (missed.length) parts.push(`Also banned: ${missed.map(k => MOVE_LABELS[k].toLowerCase()).join(", ")}.`);
    if (extra.length) parts.push(`Still allowed: ${extra.map(k => MOVE_LABELS[k].toLowerCase()).join(", ")}.`);
    why = parts.join(" ") + " " + why;
  }
  return { ok, why, rule: s.rule };
}

/* ---------- 1.6 approach ---------- */
export const SPEED = { min: 0, max: 60, step: 5, initial: 30 } as const;
export function judgeApproach(s: ApproachItem, { speed: v, horn: h }: { speed: number; horn: boolean }): JudgedVerdict {
  const ok = v >= s.min && v <= s.max && h === s.horn;
  const parts: string[] = [];
  if (v < s.min) parts.push(s.min > 0 ? (v === 0 ? "You don't need to stop here." : "Too slow.") : "");
  if (v > s.max) parts.push(s.max === 0 ? `You must stop here, not drive through at ${v} km/h.` : `${v} km/h is too fast here.`);
  if (h !== s.horn) parts.push(s.horn ? "You also needed to sound the horn." : "The horn wasn't called for.");
  return { ok, why: (ok ? "" : parts.filter(Boolean).join(" ") + " ") + s.why, rule: s.rule };
}

/* ---------- 1.7 〇× ---------- */
export function judgeTF(s: TFItem, answer: boolean): JudgedVerdict {
  return { ok: answer === s.a, why: `Answer: <b>${s.a ? "〇" : "×"}</b>. ${s.why}`, rule: s.rule };
}
