# Hyōshiki Dojo

An interactive web game for learning Japanese road signs and traffic rules, built chapter by chapter from the official rule book. Instead of matching signs to names, you act on them: sort them, drive past them, draw your path through an intersection, stop at the right line.

## Play

Open `index.html` in a browser. No build step and no server needed; it works from a local file or GitHub Pages.

## Source of truth

Every scenario cites the clause it comes from (`ref` in the level data).

| Source | Version | Use |
|---|---|---|
| [交通の方法に関する教則](https://www.npa.go.jp/bureau/traffic/20241113kyousoku.pdf) (National Police Agency) | Consolidated to the 4 Sep 2024 amendment (告示第37号) | Primary text, chapter structure |
| 道路交通法施行令 第2条 | — | Signal meanings (paraphrased) |
| Driving-school textbook (学科教本) | — | Tiebreaker when sources disagree |

Known changes after the 2024 consolidation that later chapters must patch in:

- **1 Apr 2026:** new rule on how vehicles pass cyclists on the right.
- **1 Sep 2026:** default speed on residential roads (生活道路) drops from 60 to 30 km/h.

### Verification status

Every rule the game teaches lives in [`kb/`](kb/) with a status: **primary** (confirmed in official text that was actually read), **secondary** (police or driving-school source citing the law) or **unverified** (general knowledge). The game shows the status on every answer. The current breakdown and the list of rules to check first are in [`kb/STATUS.md`](kb/STATUS.md), generated from the data.

## Chapters

| Game ch. | 教則 section | Topic | Status |
|---|---|---|---|
| 1 | 第1章 第2節 | Signals, signs and markings (v2: 7 levels, 75 items) | Done |
| 2 | 第5章 第2節 | Where cars may drive | Done |
| 3 | 第5章 第3節 | Protecting pedestrians, crosswalks | Next |
| 4 | 第5章 第4節 | Speed and following distance (incl. 30 km/h change) | Planned |
| 5 | 第5章 第7節 | Intersections and turns | Planned |
| 6 | 第5章 第8節 | Parking and stopping | Planned |
| 7 | 第5章 第5–6節 | Lane changes and overtaking | Planned |
| 8 | 第6章 | Railway crossings, hills, night, bad weather | Planned |
| 9 | 第7章 | Expressways | Planned |
| Bonus | — | Road-sign kanji: 21 kanji, 22 words, 16 readings, 10 build-the-word, 10 plate phrases | Done |

## Layout

```
kb/sources.json  every source the rules cite
kb/rules/*.json  the rules: en/ja statement, refs, status (one file per topic)
kb/vocab/*.json  sign vocabulary for the bonus chapter
kb/STATUS.md     generated verification report
tools/build-kb.mjs  validates kb/ and levels, generates js/kb.js + kb/STATUS.md
tests/e2e.py     plays every item; checks scoring and session tracking
index.html       page shell
css/style.css    theme tokens (light/dark) and layout
js/render.js     sign artwork, signal heads, road scenes
levels/ch1.js    Chapter 1 scenario data, with source refs
levels/ch2.js    Chapter 2 scenario data (lane scenarios are pure data)
levels/bonus.js  Bonus kanji vocabulary (word lists turned into levels)
js/kb.js         GENERATED knowledge base bundle
js/track.js      session tracking (localStorage)
js/game.js       state, level runners, progress saving, History panel
```

### Working on content

1. Edit or add a rule in `kb/rules/`. Level items reference rules by id (`rule:"sig.yellow"` or an array).
2. Run `node tools/build-kb.mjs`. It fails on unknown rule ids, bad statuses, missing sources, or kanji build tiles that don't spell their word.
3. Run `python3 tests/e2e.py` (Playwright) to play every item.

### Session tracking

`js/track.js` stores, in this browser only: sessions (a new one starts after 30 minutes without an answer; last 200 kept), and per-item stats (attempts, first-try results, time, last seen). Item keys hash the item's own data, so they survive reordering. The History button shows this session, all-time totals, recent sessions and the items you miss most, with Export JSON and Clear.

### Build and deploy

The game itself is plain classic scripts, so `index.html` still runs from `file://` (with SVG scenes). The immersive engine in `engine/` (TypeScript, PixiJS v8, GSAP, Web Audio) is built by Vite into `dist/engine/` and loaded on demand with `import()` only when a level uses it; if it is missing or WebGL fails, the level keeps its SVG scene.

CI (`.github/workflows/ci.yml`) runs on every push: knowledge-base check, typecheck, build, bundle-size report, then `tests/e2e.py` twice against the built site over http — once with the engine, once with it disabled. Pushes to `main` deploy `dist/` to GitHub Pages (Pages source must be set to *GitHub Actions*).

Local commands (need npm): `npm ci`, `npm run build`, then serve `dist/` and run `HD_URL=http://localhost:PORT/ python3 tests/e2e.py`.

Each `levels/chN.js` pushes one object onto `CHAPTERS`. A level's `kind` picks its mechanic in `js/game.js`: `sort`, `plate`, `signal`, `stoppos`, `bans` (tap what's banned), `approach` (speed + horn), `tf` (〇× with a review queue) in Chapter 1; `lanes` (draw your route: stay, wait behind, change lane, or pass and move back; collisions count) and `kerb` (draw your route across the pavement, holding still to stop) in Chapter 2, each judged from the drawn path, with tap-to-choose routes as a fallback; `match` (drag to one of four answers) and `build` (tap tiles in order, with lookalike decoys) in the bonus chapter. Missed `tf`, `match` and `build` items return once at the end of the set. `bans`, `approach` and `tf` items are pure data too. New lane scenarios need no code: describe the lanes, markings and objects, plus the expected route as `path:{stay|follow|pass:L|move:[lanes],never:[lanes]}`. Link to a chapter with `#ch2` or `#bonus`. Progress is saved per chapter in the browser.

Sign images are the official designs from Wikimedia Commons (public domain), fetched by `.github/workflows/signs.yml` with `tools/commons-signs.mjs` into `assets/signs/`. Each file's Commons page, licence and author are in `kb/signs.json`; the KB check fails if any sign lacks a file or an allowed licence. To add a sign: add its key to `js/render.js` and `kb/signs.json` (with the Commons file name), then push a commit to the `signs` branch whose message contains `[fetch-signs]`.
