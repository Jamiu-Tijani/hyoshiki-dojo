/* Hash routing (docs/redesign.md → Stack). Pure: no DOM, tested in tests/app/route.test.mjs.
   Link shapes:
     #            Home              #learn        Learn          #progress   Progress
     #settings    Settings          #ch1 #ch2 #bonus  Chapter (same deep links as the old game)
     #ch1/<level> Level player (focused: no tab bar)
   Anything else falls back to Home. A leading "/" is tolerated ("#/learn"). */

export const CHAPTER_IDS = ["ch1", "ch2", "bonus"] as const;
export type ChapterId = (typeof CHAPTER_IDS)[number];
export type Tab = "home" | "learn" | "progress";

export type Route =
  | { screen: "home" | "learn" | "progress" | "settings" }
  | { screen: "chapter"; chapter: ChapterId }
  | { screen: "level"; chapter: ChapterId; level: string };

const isChapter = (s: string): s is ChapterId => (CHAPTER_IDS as readonly string[]).includes(s);
const LEVEL_ID = /^[A-Za-z0-9_-]{1,64}$/;

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, "").replace(/^\//, "").replace(/\/$/, "");
  if (raw === "learn" || raw === "progress" || raw === "settings") return { screen: raw };
  const [head, level, ...rest] = raw.split("/");
  if (head !== undefined && isChapter(head) && rest.length === 0) {
    if (level === undefined) return { screen: "chapter", chapter: head };
    if (LEVEL_ID.test(level)) return { screen: "level", chapter: head, level };
  }
  return { screen: "home" };
}

export function toHash(r: Route): string {
  switch (r.screen) {
    case "home": return "#";
    case "chapter": return `#${r.chapter}`;
    case "level": return `#${r.chapter}/${r.level}`;
    default: return `#${r.screen}`;
  }
}

/** Which tab is highlighted; null on focused screens, which hide the tab bar. */
export function tabFor(r: Route): Tab | null {
  switch (r.screen) {
    case "level": return null;
    case "chapter": case "learn": return "learn";
    case "progress": return "progress";
    default: return "home"; // home, settings
  }
}
