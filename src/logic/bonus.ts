/* Bonus chapter judges: match (four options) and build (tiles in order).
   The old code appended a "Listen" button to the explanation; that is UI, so these
   return `listen` (the text to speak, or null) instead of the button markup. */
import { shuffle, type Rng } from "./random.ts";
import type { BuildItem, MatchItem, Verdict } from "./types.ts";

export type BonusVerdict = Verdict & { listen: string | null };

export const ruby = (word: string, read?: string) => read ? `<ruby>${word}<rt>${read}</rt></ruby>` : word;

/** The right answer plus three distinct distractors from the level, shuffled. */
export function matchOptions(items: MatchItem[], s: MatchItem, rng: Rng = Math.random): string[] {
  const pool = [...new Set(items.map(i => i.a))].filter(a => a !== s.a);
  return shuffle([s.a, ...shuffle(pool, rng).slice(0, 3)], rng);
}

export function judgeMatch(s: MatchItem, chosen: string, field: "meaning" | "reading" = "meaning"): BonusVerdict {
  const ok = chosen === s.a;
  const head = `<span lang="ja" class="kans">${ruby(s.show, s.read)}</span>`;
  const tail = field === "reading" ? ` means <b>${s.mean}</b>.` : ` means <b>${s.a}</b>.`;
  const why = head + tail + (s.note ? " " + s.note : "") + (ok ? "" : ` You chose “${chosen}”.`);
  return { ok, why, listen: s.read || field === "reading" ? s.show : null };
}

export function judgeBuild(s: BuildItem, got: string[]): BonusVerdict {
  const ok = got.join("") === s.tiles.join("");
  const head = `<span lang="ja" class="kans">${ruby(s.word, s.read)}</span> means <b>${s.mean}</b>.`;
  const wrong = ok ? "" : ` You wrote <span lang="ja">${got.join("")}</span>.` + (got.some(t => s.decoys.includes(t)) ? " One of those is a lookalike." : "");
  return { ok, why: head + wrong, listen: s.word };
}

/** Tiles to show: the real ones plus decoys, shuffled. */
export function buildTiles(s: BuildItem, rng: Rng = Math.random): string[] {
  return shuffle([...s.tiles, ...s.decoys], rng);
}
