/* Session tracking. Same storage keys, shapes and item-key hash as js/track.js, so
   history recorded by the current site carries over unchanged.

     hd.v2.meta      {schema, current, last}
     hd.v2.sessions  [{id, start, end, answers, correct, firstAnswers, firstCorrect, ms, levels:{"ch1/bans":{a,c}}}]  newest last, capped
     hd.v2.items     {"ch1/bans/<hash>": {n, ok, firstN, firstOk, last, ms, label, lvl}}

   A session is a run of answers with no gap longer than 30 minutes. */

export const TRACK_KEYS = { meta: "hd.v2.meta", sessions: "hd.v2.sessions", items: "hd.v2.items" } as const;
export const SESSION_GAP_MS = 30 * 60 * 1000;
export const MAX_SESSIONS = 200;
export const MAX_ITEM_MS = 5 * 60 * 1000;

export type Meta = { schema: 2; current: string | null; last: number };
export type Session = {
  id: string; start: number; end: number; answers: number; correct: number;
  firstAnswers: number; firstCorrect: number; ms: number; levels: Record<string, { a: number; c: number }>;
};
export type ItemStat = { n: number; ok: number; firstN: number; firstOk: number; last: number; ms: number; label: string; lvl: string };
export type Totals = { sessions: number; answers: number; correct: number; firstAnswers: number; firstCorrect: number; ms: number; itemsSeen: number };
export type Weak = ItemStat & { key: string; rate: number };

/** The subset of Storage used. Any method may throw (private mode, quota). */
export type KV = { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void };

/** djb2 over UTF-16 code units, base 36. Must not change: it is part of every stored item key. */
export function hash(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
/** `item` must be the item object exactly as defined in the level data. */
export function keyFor(chapterId: string, levelId: string, item: unknown): string {
  return `${chapterId}/${levelId}/${hash(JSON.stringify(item))}`;
}

export type Tracker = ReturnType<typeof createTracker>;

export function createTracker(storage: () => KV | null, now: () => number = Date.now) {
  const get = <T>(k: string, d: T): T => { try { const v = storage()?.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
  const put = (k: string, v: unknown): boolean => { try { const s = storage(); if (!s) return false; s.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

  let meta: Meta = get<Meta | null>(TRACK_KEYS.meta, null) || { schema: 2, current: null, last: 0 };
  let sessions: Session[] = get<Session[]>(TRACK_KEYS.sessions, []); if (!Array.isArray(sessions)) sessions = [];
  let items: Record<string, ItemStat> = get<Record<string, ItemStat>>(TRACK_KEYS.items, {}); if (!items || typeof items !== "object") items = {};
  let t0 = 0, curKey: string | null = null;

  function session(t: number): Session {
    let s = sessions.find(x => x.id === meta.current);
    if (!s || t - meta.last > SESSION_GAP_MS) {
      s = { id: t.toString(36), start: t, end: t, answers: 0, correct: 0, firstAnswers: 0, firstCorrect: 0, ms: 0, levels: {} };
      sessions.push(s);
      if (sessions.length > MAX_SESSIONS) sessions.splice(0, sessions.length - MAX_SESSIONS);
      meta.current = s.id;
    }
    return s;
  }
  function save() {
    if (put(TRACK_KEYS.sessions, sessions) && put(TRACK_KEYS.items, items) && put(TRACK_KEYS.meta, meta)) return;
    // Out of space: drop the oldest half of the sessions and retry once.
    sessions.splice(0, Math.ceil(sessions.length / 2));
    put(TRACK_KEYS.sessions, sessions); put(TRACK_KEYS.items, items); put(TRACK_KEYS.meta, meta);
  }

  return {
    keyFor,
    /** Call when a question is shown. */
    start(key: string) { curKey = key; t0 = now(); },
    /** Call on every answer; `first` = first attempt at this question in this showing. */
    answer({ key, chapter, level, ok, first, label }: { key: string; chapter: string; level: string; ok: boolean; first: boolean; label?: string }) {
      const t = now(), s = session(t);
      const ms = key === curKey && t0 ? Math.min(t - t0, MAX_ITEM_MS) : 0;
      s.end = t; s.answers++; if (ok) s.correct++; s.ms += ms;
      if (first) { s.firstAnswers++; if (ok) s.firstCorrect++; }
      const lk = `${chapter}/${level}`, L = s.levels[lk] = s.levels[lk] || { a: 0, c: 0 }; L.a++; if (ok) L.c++;
      const it = items[key] = items[key] || { n: 0, ok: 0, firstN: 0, firstOk: 0, last: 0, ms: 0, label: "", lvl: lk };
      it.n++; if (ok) it.ok++; if (first) { it.firstN++; if (ok) it.firstOk++; }
      it.last = t; it.ms += ms; if (label) it.label = label; it.lvl = lk;
      meta.last = t;
      if (ok) t0 = 0;
      save();
    },
    current(): Session | null { const s = sessions.find(x => x.id === meta.current); return s && now() - meta.last <= SESSION_GAP_MS ? s : null; },
    sessions(): Session[] { return sessions.slice(); },
    items(): Record<string, ItemStat> { return items; },
    totals(): Totals {
      const t: Totals = { sessions: sessions.length, answers: 0, correct: 0, firstAnswers: 0, firstCorrect: 0, ms: 0, itemsSeen: Object.keys(items).length };
      for (const s of sessions) { t.answers += s.answers; t.correct += s.correct; t.firstAnswers += s.firstAnswers; t.firstCorrect += s.firstCorrect; t.ms += s.ms; }
      return t;
    },
    weakest(n = 5): Weak[] {
      return Object.entries(items).filter(([, v]) => v.firstN >= 1 && v.firstOk < v.firstN)
        .map(([k, v]) => ({ key: k, ...v, rate: v.firstOk / v.firstN }))
        .sort((a, b) => a.rate - b.rate || b.firstN - a.firstN || b.last - a.last).slice(0, n);
    },
    exportJSON(): string { return JSON.stringify({ exported: new Date(now()).toISOString(), meta, sessions, items }, null, 1); },
    clear() {
      sessions = []; items = {}; meta = { schema: 2, current: null, last: 0 };
      try { const s = storage(); s?.removeItem(TRACK_KEYS.sessions); s?.removeItem(TRACK_KEYS.items); s?.removeItem(TRACK_KEYS.meta); } catch { /* private mode */ }
    },
  };
}

/** Browser storage accessor that tolerates a throwing `localStorage` getter. */
export const browserStorage = (): KV | null => { try { return globalThis.localStorage ?? null; } catch { return null; } };
