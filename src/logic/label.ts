/* Short human label for an item, stored with its tracking stats ("Needs work" list).
   Same text as itemLabel in js/game.js, so stored labels stay consistent. */
import { GOAL_WORDS, SIGNAL_WORDS } from "./chapter1.ts";
import type { Item, Level } from "./types.ts";

/** @param position 0-based index of the item in level.items (fallback label "item N"). */
export function itemLabel(level: Pick<Level, "n">, item: Item, position: number, signName: (key: string) => string | undefined): string {
  const it = item as Record<string, any>;
  const strip = (t: unknown) => String(t).replace(/<[^>]+>/g, "");
  let t: string = typeof item === "string" ? (signName(item) ?? item)
    : it.show || it.word || it.q || (it.sign && signName(it.sign))
      || (it.goal && it.sig && `${GOAL_WORDS[it.goal as keyof typeof GOAL_WORDS]} on ${SIGNAL_WORDS[it.sig as keyof typeof SIGNAL_WORDS]}`)
      || (it.hud && it.hud.map((h: [string, string]) => h[1]).join(", "))
      || (it.dir && (it.dir === "in" ? "Into a car park" : "Out of a car park")) || "";
  t = strip(t);
  if (t.length > 38) t = t.slice(0, 37) + "…";
  return `${level.n} · ${t || "item " + (position + 1)}`;
}
