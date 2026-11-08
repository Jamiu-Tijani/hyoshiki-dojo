/* Scoring and the review queue, replaying what tests/e2e.py expects of the old game:
   play every item right, except one wrong first answer in review kinds;
   cards = n (+1 for review kinds), score = n (−1 for review kinds). */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as L from "../../src/logic/index.ts";

const g = JSON.parse(readFileSync(new URL("./golden.json", import.meta.url), "utf8"));
const levels = g.chapters.flatMap(C => C.levels.map(l => ({ ...l, items: l.items.map(r => r.item), chapter: C.id })));

function play(level, rng, { wrongFirstCard }) {
  let run = L.startRun(level, rng), progress = {}, cards = 0;
  const firsts = [];
  for (;;) {
    cards++;
    const ok = !(wrongFirstCard && cards === 1);
    const r = L.recordAnswer(run, progress, ok);
    run = r.run; progress = r.progress; firsts.push(r.first);
    if (!ok && L.REVIEW_KINDS.includes(level.kind)) run = L.requeue(run);
    const nx = L.next(run);
    if (!nx) break;
    run = nx;
  }
  return { cards, score: L.score(progress), progress, firsts, run };
}

for (const lvl of levels) {
  test(`${lvl.chapter}/${lvl.id}: e2e play-through gives the same card count and score`, () => {
    const review = L.REVIEW_KINDS.includes(lvl.kind), n = lvl.items.length;
    const { cards, score, firsts } = play(lvl, L.seeded(7), { wrongFirstCard: review });
    assert.equal(cards, n + (review ? 1 : 0));
    assert.equal(score, n - (review ? 1 : 0));
    if (review) assert.equal(firsts.at(-1), false, "the review card is never a first try");
  });
}

test("order: sort and review kinds are shuffled, the rest play in data order", () => {
  for (const lvl of levels) {
    const run = L.startRun(lvl, L.seeded(3));
    const ident = lvl.items.map((_, i) => i);
    assert.deepEqual([...run.order].sort((a, b) => a - b), ident, `${lvl.id}: order is a permutation`);
    if (L.shouldShuffle(lvl)) assert.notDeepEqual(run.order, ident, `${lvl.id}: expected a shuffle`);
    else assert.deepEqual(run.order, ident, `${lvl.id}: expected data order`);
  }
});

test("retry after a miss never scores; a later right first-try answer does not resurrect it", () => {
  const lvl = levels.find(l => l.kind === "bans");
  let run = L.startRun(lvl), p = {};
  ({ run, progress: p } = L.recordAnswer(run, p, false));
  run = L.retry(run);
  const r = L.recordAnswer(run, p, true);
  assert.equal(r.first, false);
  assert.equal(r.progress[0], false);
  assert.equal(L.score(r.progress), 0);
});

test("a right first try sticks even if a later attempt (e.g. Play again without clearing) misses", () => {
  const lvl = levels.find(l => l.kind === "plate");
  let run = L.startRun(lvl), p = {};
  ({ progress: p } = L.recordAnswer(run, p, true));
  ({ progress: p } = L.recordAnswer(L.startRun(lvl), p, false));
  assert.equal(p[0], true);
});

test("requeue sends an item back only once", () => {
  const lvl = levels.find(l => l.kind === "tf");
  let run = L.startRun(lvl, L.seeded(1));
  const key = L.itemIndex(run);
  run = L.requeue(L.requeue(run));
  assert.equal(run.order.length, lvl.items.length + 1);
  assert.equal(run.order.at(-1), key);
});

test("Next/Finish: hasNext is false only on the last card, including after a requeue", () => {
  const lvl = levels.find(l => l.kind === "build");
  let run = L.startRun(lvl, L.seeded(5));
  for (let i = 0; i < lvl.items.length - 1; i++) run = L.next(run);
  assert.equal(L.hasNext(run), false);
  run = L.requeue(run);
  assert.equal(L.hasNext(run), true);
  run = L.next(run);
  assert.equal(L.inReview(run), true);
  assert.equal(L.next(run), null);
});

test("match options: the answer plus three distinct distractors, for every item", () => {
  for (const lvl of levels.filter(l => l.kind === "match")) for (const s of lvl.items) for (const seed of [1, 2, 3]) {
    const o = L.matchOptions(lvl.items, s, L.seeded(seed));
    assert.equal(o.length, 4, `${lvl.id} ${s.show}`);
    assert.equal(new Set(o).size, 4);
    assert.ok(o.includes(s.a));
  }
});

test("build tiles: every real tile and decoy exactly once", () => {
  for (const s of levels.find(l => l.kind === "build").items) {
    const t = L.buildTiles(s, L.seeded(9));
    assert.deepEqual([...t].sort(), [...s.tiles, ...s.decoys].sort());
    assert.equal(L.judgeBuild(s, s.tiles).ok, true);
  }
});

test("every lanes and kerb item has at least one correct route choice", () => {
  for (const lvl of levels.filter(l => l.kind === "lanes" || l.kind === "kerb")) for (const s of lvl.items) {
    const ok = lvl.kind === "lanes"
      ? L.laneChoices(s).filter(c => L.judgeLaneRoute(s, c.line).ok)
      : L.kerbChoices(s).filter(c => L.judgeKerbPath(s, c.line).ok);
    assert.ok(ok.length >= 1, `${lvl.id}: ${s.why.slice(0, 40)}`); // one-way street: staying or moving right are both fine
  }
});

test("short strokes are ignored before judging", () => {
  assert.equal(L.isUsableStroke([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]), false);
  assert.equal(L.isUsableStroke([{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 10, y: 0 }, { x: 19, y: 0 }]), false);
  assert.equal(L.isUsableStroke([{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }]), true);
});

test("tracking never throws when storage does (private mode)", () => {
  // Same as the old Track: a failed save is treated as "storage full" and drops the oldest
  // half of the sessions, so in private mode the in-memory history empties after each answer.
  const T = L.createTracker(() => { throw new Error("denied"); }, () => 1000);
  assert.doesNotThrow(() => {
    T.start("k");
    T.answer({ key: "k", chapter: "ch1", level: "sort", ok: true, first: true });
    T.totals(); T.weakest(); T.current(); T.exportJSON(); T.clear();
  });
});
