/* Item and chapter shapes, as written in levels/*.js and kb/.
   Track item keys hash the item object as stored (JSON.stringify), so these
   types describe the data; they must never add, drop or reorder fields at load time. */

export type Point = { x: number; y: number };
export type TimedPoint = Point & { t: number };

/** A rule id or list of ids into KB.rules ("" or missing means no citation). */
export type RuleRef = string | string[] | undefined;

export type SignKind = "kisei" | "shiji" | "keikai" | "annai";

/* ---------- Chapter 1 ---------- */
export type SortItem = string; // sign key

export type PlateItem = {
  sign: string; plate: string | null; day: string; time: string; car?: string;
  ok: "north" | "east"; why: string; rule: RuleRef;
};

export type SignalState = "green" | "yellow" | "red" | "fy" | "fr";
export type Goal = "left" | "right" | "straight";
export type SignalMove = "left" | "right" | "straight" | "stop" | "stopgo";
export type SignalItem = {
  goal: Goal; sig: SignalState; arrows?: string[]; cross?: SignalState;
  plate?: boolean; peds?: boolean; ok: SignalMove[]; why: string; rule: RuleRef;
};

export type StopItem = { stopLine: boolean; cross: boolean; frontMin: number; why: string; rule: RuleRef };

export type BanMove = "straight" | "left" | "right" | "uturn" | "park" | "stop";
export type BansItem = {
  sign?: string; at?: "ahead" | "approach" | "cross"; edge?: "yellow" | "yellowdash";
  laneArrows?: boolean; car?: boolean; moves: BanMove[]; banned: BanMove[]; why: string; rule: RuleRef;
};

export type ApproachItem = {
  sign: string; min: number; max: number; horn: boolean;
  stopLine?: boolean; crosswalk?: boolean; peds?: boolean; curve?: boolean; limit?: number;
  why: string; rule: RuleRef;
};

export type TFItem = { q: string; en: string; a: boolean; why: string; rule: RuleRef };

/* ---------- Chapter 2 ---------- */
export type Lane = { dir: "up" | "down"; paint?: string };
export type LaneObjType = "cones" | "truck" | "oncoming" | "car" | "bus";
export type LaneObj = { lane: number; y: number; type: LaneObjType; color?: string };
export type LanePath = { stay?: boolean; follow?: boolean; pass?: number; move?: number[]; never?: number[] };
export type LanesItem = {
  lanes: Lane[]; lines: string[]; start: number; objs?: LaneObj[];
  hud?: [string, string][]; sign?: string; path: LanePath; why: string; rule: RuleRef;
};

export type KerbItem = { dir: "in" | "out"; peds?: boolean; why: string; rule: RuleRef };

/* ---------- Bonus ---------- */
export type MatchItem = { show: string; read?: string; a: string; mean?: string; note?: string };
export type BuildItem = { word: string; tiles: string[]; decoys: string[]; mean: string; read?: string };

export type Item =
  | SortItem | PlateItem | SignalItem | StopItem | BansItem | ApproachItem | TFItem
  | LanesItem | KerbItem | MatchItem | BuildItem;

export type Kind =
  | "sort" | "plate" | "signal" | "stoppos" | "bans" | "approach" | "tf"
  | "lanes" | "kerb" | "match" | "build";

export type Level = {
  id: string; kind?: Kind; n: string; title: string; short: string;
  task?: string; prompt?: string; field?: "meaning" | "reading"; plate?: boolean;
  items: Item[];
};

export type Chapter = {
  id: string; n: number | string; tag?: string; jp: string; en: string; short: string;
  src: string; saveKey: string; sources: string[]; intro?: string; rules?: boolean;
  levels: Level[];
};

/** Mechanic of a level: `kind` if set, else its id (Chapter 1 levels are named by mechanic). */
export const kindOf = (L: Pick<Level, "id" | "kind">): Kind => (L.kind || L.id) as Kind;

/* ---------- knowledge base ---------- */
export type RuleStatus = "primary" | "secondary" | "unverified";
export type KbSource = { short: string; title: string; publisher?: string; url?: string; kind: string; note?: string };
export type KbRule = { id: string; en: string; ja: string; refs: { src: string; loc?: string }[]; status: RuleStatus; topic?: string; note?: string };
export type Kb = { sources: Record<string, KbSource>; rules: Record<string, KbRule> };

/** Result every judge returns. `why` keeps the old HTML strings (with <b>, <span>) unchanged. */
export type Verdict = { ok: boolean; why: string };
