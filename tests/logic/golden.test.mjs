/* Parity: src/logic must decide exactly what the classic-script game decided.
   golden.json is produced by tools/golden-old.py from the old UI; see that file. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as L from "../../src/logic/index.ts";

const g = JSON.parse(readFileSync(new URL("./golden.json", import.meta.url), "utf8"));
const kb = g.kb;

/* the old citeHTML markup, rebuilt from the new cite() data */
function citeHTML(ids) {
  const c = L.cite(ids, kb);
  if (!c) return "";
  const refs = c.refs.map(r => r.url ? `<a href="${r.url}" target="_blank" rel="noopener">${r.text}</a>` : r.text);
  return `<span class="src"><span class="badge st-${c.status}" title="${c.detail}">${c.label}</span>${refs.length ? " " + refs.join(" · ") : ""}</span>`;
}

/* new judge for one recorded answer → { ok, why } in the old feedback wording */
function judge(kind, level, rec, input) {
  const s = rec.item;
  switch (kind) {
    case "sort": return L.judgeSort(rec.sign, input, kb);
    case "plate": return L.judgePlate(s, input);
    case "signal": return L.judgeSignal(s, { kind: input, lane: true });
    case "stoppos": return L.judgeStop(s, input);
    case "bans": return L.judgeBans(s, input);
    case "approach": return L.judgeApproach(s, input);
    case "tf": return L.judgeTF(s, input);
    case "lanes": { const c = L.laneChoices(s)[input]; const r = L.judgeLaneRoute(s, c.line); return { ok: r.ok, why: (r.ok ? "" : r.msg + " ") + s.why, label: c.label }; }
    case "kerb": { const c = L.kerbChoices(s)[input]; const r = L.judgeKerbPath(s, c.line); return { ok: r.ok, why: (r.ok ? "" : r.msg + " ") + s.why, label: c.label }; }
    case "match": return L.judgeMatch(s, input, level.field || "meaning");
    case "build": return L.judgeBuild(s, input);
    default: throw new Error("unknown kind " + kind);
  }
}

for (const C of g.chapters) for (const lvl of C.levels) {
  test(`${C.id}/${lvl.id} (${lvl.kind}): every answer judged as before`, () => {
    let n = 0;
    lvl.items.forEach((rec, ii) => {
      const where = `${C.id}/${lvl.id} item ${ii}`;
      assert.equal(L.keyFor(C.id, lvl.id, rec.item), rec.key, `${where}: tracking key`);
      const signName = k => g.signs[k]?.jp;
      assert.equal(L.itemLabel(lvl, rec.item, ii, signName), rec.label, `${where}: label`);
      if (lvl.kind === "lanes" || lvl.kind === "kerb")
        assert.equal(lvl.kind === "lanes" ? L.laneChoices(rec.item).length : L.kerbChoices(rec.item).length, rec.answers.length, `${where}: number of route choices`);
      for (const a of rec.answers) {
        const got = judge(lvl.kind, lvl, rec, a.input);
        assert.ok(got, `${where} ${JSON.stringify(a.input)}: no verdict`);
        assert.equal(got.ok, a.verdict === "Correct", `${where} ${JSON.stringify(a.input)}: verdict`);
        assert.equal(got.why, a.why, `${where} ${JSON.stringify(a.input)}: explanation`);
        if (a.label) assert.equal(got.label, a.label, `${where}: choice label`);
        n++;
      }
    });
    assert.ok(n > 0);
  });
}

test("signal: drawn routes classify as before", () => {
  for (const [name, { pts, out }] of Object.entries(g.classify)) assert.deepEqual(L.classifySignalPath(pts), out, name);
});

test("geometry helpers match", () => {
  assert.deepEqual(L.densify([{ x: 0, y: 0, t: 0 }, { x: 10, y: 0, t: 0 }, { x: 10, y: 9, t: 0 }]), g.densify);
  assert.equal(L.dwellIn(g.classify.stopgo.pts, p => p.y >= 230 && p.y <= 250), g.dwell);
});

test("lanes: the e2e suite's drawn routes are judged as before", () => {
  const ch2 = g.chapters.find(c => c.id === "ch2");
  for (const d of g.drawn) {
    const s = ch2.levels.find(l => l.id === d.level).items[d.i].item;
    assert.deepEqual(L.judgeLaneRoute(s, d.line.map(([x, y]) => ({ x, y }))), d.out, `${d.level} #${d.i}`);
  }
});

test("kerb: drawn routes with and without a hold are judged as before", () => {
  for (const d of g.kerbDrawn) assert.deepEqual(L.judgeKerbPath({ dir: d.dir }, d.pts), d.out, JSON.stringify(d.pts));
});

test("citations: same status, label and references for every rule", () => {
  for (const [k, html] of Object.entries(g.cite)) {
    const ids = k === "" ? "" : k.includes("|") ? k.split("|") : k;
    assert.equal(citeHTML(ids), html, k || "(empty)");
  }
});

test("tracking: same storage after the same answers at the same times", () => {
  const mem = new Map();
  const kv = { getItem: k => mem.has(k) ? mem.get(k) : null, setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
  let now = 0;
  const T = L.createTracker(() => kv, () => now);
  g.track.steps.forEach((s, i) => {
    now = s.t;
    if (s.op === "start") T.start(s.key); else T.answer(s);
    const exp = g.track.after[i], cur = T.current();
    assert.deepEqual(T.totals(), exp.totals, `step ${i} totals`);
    assert.equal(cur ? cur.id : null, exp.current, `step ${i} current session`);
    assert.deepEqual(T.weakest(5), exp.weakest, `step ${i} weakest`);
  });
  assert.deepEqual(JSON.parse(mem.get("hd.v2.meta")), g.track.storage.meta);
  assert.deepEqual(JSON.parse(mem.get("hd.v2.sessions")), g.track.storage.sessions);
  assert.deepEqual(JSON.parse(mem.get("hd.v2.items")), g.track.storage.items);
});
