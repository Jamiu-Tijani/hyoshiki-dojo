"""Records what the CURRENT (classic-script) game decides for every item and every
answer a player can give, so the React port's src/logic can be checked against it.

    python3 tools/golden-old.py            (needs: pip install playwright; a Chromium/Chrome)

Writes tests/logic/golden.json. The file carries its own copy of each item and of the
knowledge base, so it stays a valid regression fixture after the old app is removed.
Regenerate only while js/game.js still exists, and only on purpose: a diff in this file
means the old behaviour changed."""
import asyncio, json, os, pathlib, sys
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "tests" / "logic" / "golden.json"
URL = os.environ.get("HD_URL") or (ROOT / "index.html").as_uri()

# Runs inside the page. Uses the old game's own globals (CHAPTERS, lv(), renderScenario, ...).
COLLECT = r"""
async () => {
  const ui = {};
  const fbWhy = () => { const s = document.querySelectorAll('#fb .feedback > span'); return s.length > 1 ? s[1].innerHTML : null; };
  const verdict = () => { const v = document.querySelector('#fb .verdict'); return v ? v.textContent : null; };
  const stripListen = h => h == null ? h : h.replace(/ ?<button[^>]*id="listen"[^>]*>[^<]*<\/button>/, '').replace(/\s+$/, '');
  const show = (ci, li, ii) => {          // put item ii of level li of chapter ci on screen, fresh state
    if (chi !== ci) loadChapter(ci);
    cur = li; order = lv().items.map((_, k) => k); idx = ii; requeued = new Set(); firstTry = true; keepFirst = false;
    renderScenario();
  };
  const tapSvg = (x, y) => {               // pointer tap at viewBox coords on #f
    const f = document.getElementById('f'), m = f.getScreenCTM(), p = f.createSVGPoint(); p.x = x; p.y = y;
    const c = p.matrixTransform(m);
    f.dispatchEvent(new PointerEvent('pointerdown', { clientX: c.x, clientY: c.y, pointerId: 1, bubbles: true }));
    f.dispatchEvent(new PointerEvent('pointerup', { clientX: c.x, clientY: c.y, pointerId: 1, bubbles: true }));
  };
  const click = sel => document.querySelector(sel).click();
  const subsets = a => a.reduce((acc, x) => acc.concat(acc.map(s => [...s, x])), [[]]);

  const chapters = [];
  for (let ci = 0; ci < CHAPTERS.length; ci++) {
    const C = CHAPTERS[ci], levels = [];
    for (let li = 0; li < C.levels.length; li++) {
      const L = C.levels[li], kind = L.kind || L.id, items = [];
      for (let ii = 0; ii < L.items.length; ii++) {
        const it = L.items[ii];
        show(ci, li, ii);
        const rec = { item: it, key: itemKey(), label: itemLabel(), answers: [] };
        const add = (input, extra) => rec.answers.push({ input, verdict: verdict(), why: stripListen(fbWhy()), ...(extra || {}) });
        if (kind === 'sort') {
          rec.sign = { ...SIGNS[it] };
          for (const c of Object.keys(CAT)) { show(ci, li, ii); click('#bin-' + c); add(c); }
        } else if (kind === 'plate') {
          for (const z of ['north', 'east']) { show(ci, li, ii); const Z = { north: [180, 58], east: [302, 171] }[z]; tapSvg(...Z); add(z); }
        } else if (kind === 'signal') {
          for (const k of ['left', 'straight', 'right', 'stop', 'stopgo']) { show(ci, li, ii); click('#showalt'); click(`#alt button[data-k="${k}"]`); add(k); }
        } else if (kind === 'stoppos') {
          /* fronts up to 278 only: a tap within 40 of the car (y 318) starts a drag instead */
          for (let front = 125; front <= 278; front += 3) { show(ci, li, ii); tapSvg(150, front); click('#confirm');
            /* the front the old code actually judged: screen round-trips can shift the tap by a hair */
            const cy = +document.querySelector('#f g[transform^="translate(150 "]').getAttribute('transform').match(/translate\(150 ([-\d.e]+)\)/)[1];
            add(cy - 25, { requested: front }); }
        } else if (kind === 'bans') {
          for (const sel of subsets(it.moves)) {
            show(ci, li, ii);
            for (const k of sel) document.querySelector(`.move[aria-label="${MOVES[k].label}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true }));
            click('#check'); add(sel);
          }
        } else if (kind === 'approach') {
          for (let v = 0; v <= 60; v += 5) for (const h of [false, true]) {
            show(ci, li, ii);
            const s = document.getElementById('spd'); s.value = v; s.dispatchEvent(new Event('input'));
            if (h) click('#horn');
            click('#drive'); add({ speed: v, horn: h });
          }
        } else if (kind === 'tf') {
          for (const a of [true, false]) { show(ci, li, ii); click('#bin-' + a); add(a); }
        } else if (kind === 'lanes' || kind === 'kerb') {
          const n = document.querySelectorAll('#alt button').length;
          for (let c = 0; c < n; c++) {
            show(ci, li, ii); const label = document.querySelectorAll('#alt button')[c].textContent;
            click('#showalt'); click(`#alt button[data-c="${c}"]`); add(c, { label });
          }
        } else if (kind === 'match') {
          const pool = [...new Set(L.items.map(x => x.a))];
          for (const v of [...new Set([it.a, ...pool.filter(a => a !== it.a).slice(0, 3)])]) {
            show(ci, li, ii);
            let b = [...document.querySelectorAll('.kbin')].find(x => x.dataset.v === v);
            if (!b) { b = document.querySelector('.kbin'); b.dataset.v = v; }  // judge only reads the chosen value
            b.click(); add(v);
          }
        } else if (kind === 'build') {
          const seqs = [it.tiles, [it.decoys[0], ...it.tiles.slice(1)], [...it.tiles].reverse()];
          for (const seq of seqs) {
            show(ci, li, ii);
            for (const t of seq) [...document.querySelectorAll('.tile')].find(b => b.dataset.t === t && !b.disabled).click();
            add(seq);
          }
        }
        items.push(rec);
      }
      levels.push({ id: L.id, kind, n: L.n, field: L.field, items });
    }
    chapters.push({ id: C.id, levels });
  }

  /* pure helpers, called directly */
  const pts = (...a) => a.map(([x, y, t]) => ({ x, y, t }));
  const signalPaths = {
    left_lane: pts([150, 293, 0], [150, 200, 300], [140, 160, 500], [60, 150, 800]),
    left_wronglane: pts([150, 293, 0], [150, 200, 300], [130, 100, 500], [60, 90, 800]),
    right_lane: pts([150, 293, 0], [160, 120, 400], [300, 90, 800]),
    right_wronglane: pts([150, 293, 0], [160, 160, 400], [300, 150, 800]),
    straight: pts([150, 293, 0], [150, 150, 300], [150, 20, 600]),
    straight_offlane: pts([150, 293, 0], [200, 150, 300], [210, 20, 600]),
    stopgo: pts([150, 293, 0], [150, 240, 200], [150, 239, 900], [150, 20, 1300]),
    stopgo_short: pts([150, 293, 0], [150, 240, 200], [150, 239, 500], [150, 20, 900]),
    stop: pts([150, 293, 0], [150, 250, 400]),
    unclear: pts([150, 293, 0], [200, 200, 400]),
  };
  const classifyOut = Object.fromEntries(Object.entries(signalPaths).map(([k, p]) => [k, { pts: p, out: classify(p) }]));
  const dense = densify(pts([0, 0, 0], [10, 0, 0], [10, 9, 0]));
  const dwell = dwellIn(signalPaths.stopgo, p => p.y >= 230 && p.y <= 250);

  /* drawn routes from the e2e suite, judged directly */
  const ch2 = CHAPTERS.find(c => c.id === 'ch2');
  const lanesItem = (lvl, i) => ch2.levels.find(l => l.id === lvl).items[i];
  const laneRoute = (s, line) => { const g = laneGeom(s.lanes.length), home = laneHome(s, g); return judgeLanePath(s, analyseLanePath(s, g, home, line.map(([x, y]) => ({ x, y })))); };
  const drawn = [
    { level: 'keepleft', i: 1, line: [[105, 265], [105, 225], [250, 190], [250, 100], [105, 55], [105, 25]] },
    { level: 'keepleft', i: 1, line: [[105, 265], [105, 150], [105, 25]] },
    { level: 'lanechoice', i: 3, line: [[80, 265], [80, 220], [280, 190], [280, 90], [80, 45], [80, 25]] },
  ].map(d => ({ ...d, out: laneRoute(lanesItem(d.level, d.i), d.line) }));
  const kerbDrawn = [
    { dir: 'in', pts: pts([180, 275, 0], [180, 182, 200], [180, 181, 900], [180, 140, 1100], [180, 60, 1400]) },
    { dir: 'in', pts: pts([180, 275, 0], [180, 182, 200], [180, 140, 300], [180, 60, 500]) },
    { dir: 'in', pts: pts([180, 275, 0], [100, 150, 200], [100, 60, 500]) },
    { dir: 'out', pts: pts([180, 85, 0], [180, 100, 200], [180, 101, 800], [180, 150, 1000], [180, 240, 1300]) },
    { dir: 'out', pts: pts([180, 85, 0], [180, 150, 200], [180, 151, 900], [180, 240, 1300]) },
    { dir: 'out', pts: pts([180, 85, 0], [180, 150, 200]) },
  ].map(d => ({ ...d, out: judgeKerbPath({ dir: d.dir }, d.pts) }));

  /* citations for every rule id and a few combinations */
  const citeOut = {};
  for (const id of Object.keys(KB.rules)) citeOut[id] = citeHTML(id);
  citeOut['sign.kinds|sign.kind.kisei'] = citeHTML(['sign.kinds', 'sign.kind.kisei']);
  citeOut['sign.plate|plate.abbrev.daika'] = citeHTML(['sign.plate', 'plate.abbrev.daika']);
  citeOut['road.keepleft|road.oneway|sig.green'] = citeHTML(['road.keepleft', 'road.oneway', 'sig.green']);
  citeOut[''] = citeHTML('');
  citeOut['missing.rule'] = citeHTML('missing.rule');

  return { kb: { rules: KB.rules, sources: KB.sources }, signs: Object.fromEntries(Object.entries(SIGNS).map(([k, v]) => [k, { jp: v.jp, en: v.en, cat: v.cat }])), chapters, classify: classifyOut, densify: dense, dwell, drawn, kerbDrawn, cite: citeOut };
}
"""

# Track replay: runs the old Track against a scripted clock in a fresh page.
TRACK_STEPS = [
    {"t": 1_000_000, "op": "start", "key": "ch1/sort/a"},
    {"t": 1_004_000, "op": "answer", "key": "ch1/sort/a", "chapter": "ch1", "level": "sort", "ok": True, "first": True, "label": "1.1 · A"},
    {"t": 1_005_000, "op": "start", "key": "ch1/sort/b"},
    {"t": 1_009_500, "op": "answer", "key": "ch1/sort/b", "chapter": "ch1", "level": "sort", "ok": False, "first": True, "label": "1.1 · B"},
    {"t": 1_012_000, "op": "answer", "key": "ch1/sort/b", "chapter": "ch1", "level": "sort", "ok": True, "first": False, "label": ""},
    {"t": 1_020_000, "op": "start", "key": "ch2/keepleft/c"},
    {"t": 1_020_000 + 9 * 60_000, "op": "answer", "key": "ch2/keepleft/c", "chapter": "ch2", "level": "keepleft", "ok": False, "first": True, "label": "2.1 · C"},
    {"t": 1_020_000 + 9 * 60_000 + 10, "op": "answer", "key": "other/key", "chapter": "ch2", "level": "keepleft", "ok": True, "first": True},
    {"t": 1_020_000 + 45 * 60_000, "op": "start", "key": "bonus/kanji/d"},
    {"t": 1_020_000 + 45 * 60_000 + 3000, "op": "answer", "key": "bonus/kanji/d", "chapter": "bonus", "level": "kanji", "ok": True, "first": True, "label": "B.1 · 止"},
]
TRACK = r"""
(steps) => {
  localStorage.clear();
  const out = [];
  for (const s of steps) {
    window.__now = s.t;
    if (s.op === 'start') Track.start(s.key);
    else Track.answer(s);
    out.push({ totals: Track.totals(), current: Track.current() && Track.current().id, weakest: Track.weakest(5) });
  }
  const dump = k => JSON.parse(localStorage.getItem(k));
  return { steps, after: out, storage: { meta: dump('hd.v2.meta'), sessions: dump('hd.v2.sessions'), items: dump('hd.v2.items') } };
}
"""

async def main():
    exe = os.environ.get("HD_CHROME") or next((p for p in ["/usr/bin/google-chrome", "/usr/bin/chromium"] if os.path.exists(p)), None)
    async with async_playwright() as p:
        b = await p.chromium.launch(**({"executable_path": exe} if exe else {}))
        pg = await b.new_page(viewport={"width": 400, "height": 900})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.add_init_script("window.HD_NO_ENGINE=true")
        await pg.goto(URL); await pg.wait_for_timeout(300)
        data = await pg.evaluate(COLLECT)

        tp = await (await b.new_context()).new_page()  # fresh storage
        tp.on("pageerror", lambda e: errs.append("track: " + str(e)))
        await tp.add_init_script("window.HD_NO_ENGINE=true; window.__now=0; Date.now=()=>window.__now;")
        await tp.goto(URL); await tp.wait_for_timeout(300)
        data["track"] = await tp.evaluate(TRACK, TRACK_STEPS)
        await b.close()
    if errs:
        print("page errors:", errs); sys.exit(1)
    data["$comment"] = "Generated by tools/golden-old.py from the classic-script game. Do not edit by hand."
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf8")
    n = sum(len(i["answers"]) for C in data["chapters"] for L in C["levels"] for i in L["items"])
    items = sum(len(L["items"]) for C in data["chapters"] for L in C["levels"])
    print(f"wrote {OUT.relative_to(ROOT)}: {items} items, {n} judged answers")

asyncio.run(main())
