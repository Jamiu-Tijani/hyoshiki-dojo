/* Playing one level: question order, first-try scoring and the review queue.
   Pure version of `startLevel`/`record`/`requeue`/`next` in js/game.js.

   Rules (unchanged):
   - sort, tf, match and build levels are shuffled; the rest play in data order.
   - An item scores only if answered right on the first try of its first showing.
     Once scored true it stays true; a later miss does not clear it.
   - tf, match and build: a miss sends the item to the end of the set once ("review").
     Answers during review never count as first tries. */
import { shuffle, type Rng } from "./random.ts";
import { kindOf, type Kind, type Level } from "./types.ts";

export const REVIEW_KINDS: readonly Kind[] = ["tf", "match", "build"];
/** Kinds whose wrong answers end the question (no "Try again"). */
export const NO_RETRY_KINDS: readonly Kind[] = ["sort", "tf", "match", "build"];

/** Saved per-level progress: item index (as a string key) → scored on first try. Stored under the chapter's saveKey. */
export type Progress = Record<string, boolean>;

export type Run = {
  readonly n: number;
  readonly order: readonly number[];
  readonly idx: number;
  readonly firstTry: boolean;
  readonly requeued: readonly number[];
};

export function shouldShuffle(level: Pick<Level, "id" | "kind">): boolean {
  return level.id === "sort" || REVIEW_KINDS.includes(kindOf(level));
}

export function startRun(level: Pick<Level, "id" | "kind" | "items">, rng: Rng = Math.random): Run {
  const ix = level.items.map((_, i) => i);
  return { n: ix.length, order: shouldShuffle(level) ? shuffle(ix, rng) : ix, idx: 0, firstTry: true, requeued: [] };
}

/** Index into level.items of the question being shown. */
export const itemIndex = (r: Run) => r.order[r.idx];
export const inReview = (r: Run) => r.idx >= r.n;
export const hasNext = (r: Run) => r.idx < r.order.length - 1;

/** Records an answer. `first` is what tracking stores as a first attempt. */
export function recordAnswer(r: Run, progress: Progress, ok: boolean): { run: Run; progress: Progress; first: boolean } {
  const key = itemIndex(r);
  const first = r.firstTry && !(r.requeued.includes(key) && r.idx >= r.n);
  const p = { ...progress };
  if (!(key in p)) p[key] = ok && first;
  else if (ok && first) p[key] = true;
  return { run: ok ? r : { ...r, firstTry: false }, progress: p, first };
}

/** Same question again after a miss; it no longer counts as a first try. */
export const retry = (r: Run): Run => ({ ...r, firstTry: false });

/** Sends the current item to the end of the set, once per item per run. */
export function requeue(r: Run): Run {
  const key = itemIndex(r);
  if (r.requeued.includes(key)) return r;
  return { ...r, requeued: [...r.requeued, key], order: [...r.order, key] };
}

/** Next question, or null when the level is finished. */
export function next(r: Run): Run | null {
  return hasNext(r) ? { ...r, idx: r.idx + 1, firstTry: true } : null;
}

export const score = (p: Progress) => Object.values(p).filter(Boolean).length;
