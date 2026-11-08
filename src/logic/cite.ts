/* Rule citations shown under every explanation (was citeHTML in js/game.js).
   Returns data; the badge component renders it. */
import type { Kb, RuleRef, RuleStatus } from "./types.ts";

export const STATUS_LABEL: Record<RuleStatus, string> = {
  primary: "Verified in the 教則",
  secondary: "From a secondary source",
  unverified: "Unverified: check your textbook",
};

export type Citation = {
  /** Weakest status among the cited rules: one unverified rule makes the whole answer unverified. */
  status: RuleStatus;
  label: string;
  /** "rule.id: status" for each rule, for a tooltip or screen-reader detail. */
  detail: string;
  refs: { text: string; url?: string }[];
};

export function cite(ruleIds: RuleRef, kb: Kb): Citation | null {
  const rs = ([] as string[]).concat(ruleIds || []).filter(Boolean).map(id => kb.rules[id]).filter(Boolean);
  if (!rs.length) return null;
  const status = (["unverified", "secondary", "primary"] as const).find(st => rs.some(r => r.status === st))!;
  const refs: Citation["refs"] = [], seen = new Set<string>();
  for (const r of rs) for (const x of r.refs) {
    const S = kb.sources[x.src];
    if (!S || x.src === "general") continue;
    const text = S.short + (x.loc ? " " + x.loc : "");
    if (seen.has(text)) continue;
    seen.add(text);
    refs.push(S.url ? { text, url: S.url } : { text });
  }
  return { status, label: STATUS_LABEL[status], detail: rs.map(r => r.id + ": " + r.status).join(", "), refs };
}
