# Redesign: React migration plan

Approved 2026-11-08. Source brief: the user's "Premium React Mobile Experience" prompt. This file records the decisions so any session can carry out the build without re-deciding them.

## Decisions

| Area | Decision |
|---|---|
| Stack | Migrate from classic-script JS to **React 19 + TypeScript + Vite**. Hash routing (keeps `#ch1`-style links). |
| Motion | **Motion for React**. Replace GSAP in the Pixi engine with Motion's `animate` (one animation library). |
| Icons | **Lucide React**, tree-shaken. |
| Tokens | `src/styles/tokens.css` (palettes, type, space, shape, depth, motion). No other colour or size literals in components. |
| Fonts | Plus Jakarta Sans (display), Satoshi (body), Noto Sans JP subset to the glyphs in `levels/` + `kb/`; fallbacks Hiragino Sans → Yu Gothic UI → system-ui. Self-hosted, fetched and subset in CI. Tabular numerals for all numbers. |
| Navigation | Bottom tab bar: **Home · Learn · Progress**. Question screens are focused (no tab bar): close, progress bar, scene, sticky answer bar. |
| Feedback | Bottom sheet over the answer bar: verdict (icon + word, not colour alone), explanation, KB citation badge, Next. |
| Scope | Redesign only. No mock exam / timer (new feature; real test format must be sourced first). No invented statistics. |
| Build environment | Needs npm in the dev session (Settings → Capabilities → allow `registry.npmjs.org`, new session). CI remains the gate. |
| Unit tests | **Node's built-in runner (`node:test`)** on `src/logic`, run with `npm run test:logic`. Changed from Vitest on 2026-11-08: Phase 2 was done in a session without npm, and `node:test` needs no install. Switching to Vitest later is mechanical if component tests need it. |

## Must be preserved

- All 11 mechanics and their judging: `sort`, `plate`, `signal` (path + hold), `stoppos`, `bans`, `approach` (Pixi), `tf`, `lanes` (path), `kerb` (path + hold), `match`, `build`. 176 items (ch1 75, ch2 22, bonus 79). *(Corrected 2026-11-08: the first draft said 13 mechanics and 225 items; counted from the level data.)*
- Review queues (tf, match, build: misses return once; first try only scores).
- KB citations and status badges (`kb/`, `tools/build-kb.mjs` stays the validator).
- Official sign images (`assets/signs/`, `kb/signs.json`).
- Local storage keys and shapes: `hyoshiki-dojo-ch1-v1`, `hyoshiki-dojo-ch2-v1`, `hyoshiki-dojo-bonus-v1`, `hyoshiki-dojo-chapter`, `hd.sound`, `hd.v2.meta`, `hd.v2.sessions`, `hd.v2.items`. Item keys are content hashes: keep the hash function and the hashed item shape identical, or existing stats orphan.
- Deep links `#ch1`, `#ch2`, `#bonus`.
- Engine lazy-loading and SVG fallback.

## Target structure

```
src/
  main.tsx, App.tsx           shell, router, theme
  styles/tokens.css, base.css
  data/                       chapters (typed), loaded from levels + kb at build time
  logic/                      pure, unit-testable: judges (lanes, kerb, signal, bans, approach…),
                              scoring, review queue, track.ts (same storage format), kb cite
  components/                 AppShell, BottomTabBar, PageHeader, Button, IconButton,
                              ProgressBar, LevelCard, QuestionScreen, AnswerOption (radio),
                              FeedbackSheet, ResultSummary, StatCard, BottomSheet,
                              ConfirmationDialog, Toast, EmptyState, Skeleton
  scenes/                     SVG scene components per mechanic (themed via tokens)
  screens/                    Home, Learn, Chapter, Level (player), Results, Progress, Settings
engine/                       Pixi scene (unchanged API; GSAP → Motion)
```

## Phases

1. **Scaffold**: React app beside the current one (`/app/` route) so `main` stays live; tokens, fonts, shell, tab bar, routing.
2. **Logic extraction**: move judges, scoring, queues and tracking into `src/logic` with unit tests that replay the current e2e expectations.
3. **Screens**: Home, Learn, Chapter, Progress, Settings.
4. **Mechanics**: port one at a time behind the shared `QuestionScreen` + `FeedbackSheet`; e2e runs against the React build after each.
5. **Cut-over**: React app becomes `/`; old files removed; README updated.
6. **Validation**: build, typecheck, Vitest, e2e (engine on/off), axe accessibility scan, manual phone check list.

## Status

| Phase | State | Notes |
|---|---|---|
| 1 Scaffold | **Done** (2026-11-08) | See below. Open decisions listed; Satoshi not yet self-hosted. |
| 2 Logic extraction | **Done** (2026-11-08) | See below. |
| 3–6 | Not started | |

### Phase 1: what exists

- **App beside the old game**: `app/index.html` → `src/main.tsx` → `src/App.tsx`, built by `vite.app.config.ts` into `dist/app/` (relative URLs, so it works under the Pages project path). Old game unchanged at `/`. `npm run dev` serves both (`/` old, `/app/` new). `npm run build` = kb check → clean `dist/` → engine → fonts + app → assemble (fails if either build is missing).
- **Packages** (pinned in `package-lock.json`): react / react-dom 19.3.1, motion 14.10.1, lucide-react 1.70.0; dev: @vitejs/plugin-react 5.2.0, @types/react(-dom) 19.3.0, subset-font, @fontsource-variable/plus-jakarta-sans, @expo-google-fonts/noto-sans-jp.
- **Routing**: `src/route.ts` (pure) + `src/useRoute.ts`. `#` Home, `#learn`, `#progress`, `#settings`, `#ch1` `#ch2` `#bonus` (same deep links as the old game) → Chapter under the Learn tab, `#<chapter>/<level>` → Level (focused, no tab bar). Unknown → Home. Focus moves to the new `h1` after navigation; `document.title` follows the route.
- **Shell**: `BottomTabBar` (Home · Learn · Progress, `aria-current`, Lucide icons, Motion indicator), `PageHeader`, `IconLink`, `EmptyState`. Every route renders a placeholder that names the phase that builds it and links to the same chapter in the old game. No content or statistics are invented.
- **Tokens**: `tokens.css` unchanged; `base.css` applies them (background, text, fonts, tabular numerals on `body`, focus ring in `--primary`). Motion reads `--dur-*` / `--ease-*` from the tokens (`src/motion.ts`); `MotionConfig reducedMotion="user"`.
- **Fonts**: `tools/fonts.mjs` runs on every app build (CI included) from npm packages: Plus Jakarta Sans variable (latin + latin-ext) and Noto Sans JP 400/700 subset to every character in `levels/`, `kb/`, `src/`, `app/` plus printable ASCII (420 glyphs, 84 KB per weight). Output `src/styles/fonts/` is git-ignored.
- **src/logic**: not imported yet; Phase 1 has no game rules. Screens and mechanics must use it (no judging in components).
- **Tests added**: `npm run test:app` (`tests/app/route.test.mjs`, 5 tests, `node:test`) and `tests/app_smoke.py` (Playwright, 390×844, reduced motion): tabs, deep links, focused route, unknown hash, focus after navigation, both fonts loaded, tabular numerals, light/dark `--bg`, no horizontal overflow, link to the old game, no console errors. Both are in CI. Mutation check: removing the fonts import or the `bonus` route fails both suites.
- **Measured bundle** (gzip): app entry JS 122 KB (React + ReactDOM 67, Motion 51, Lucide 5.5, app code the rest), CSS 2.4 KB, fonts 218 KB (woff2). CI's bundle report now lists `dist/app/assets/*.js`.

### Phase 1: open decisions (deviations or gaps; not resolved silently)

1. **Satoshi is not self-hosted.** Not on npm; Fontshare was unreachable from the dev session; the licence terms for committing its files to a public repo were not checked. Effect: body Latin text renders in Noto Sans JP Subset (next in the stack). Options: (a) fetch it in a CI workflow like `signs.yml` after confirming the licence allows it; (b) replace it with an OFL face available on npm; (c) accept Noto Sans JP for body text.
2. **@vitejs/plugin-react 5.2.0, not 6.x.** 6.x requires Vite 8; the repo is on Vite 7. Kept Vite 7 so the engine build is untouched. A Vite 8 upgrade is a separate change.
3. **Bundle is above the doc's estimate.** "~70 KB for React + ReactDOM + Motion" is wrong: React + ReactDOM alone is 67 KB. Option: `LazyMotion` + `domAnimation` cuts Motion to 37 KB (−14 KB) but drops layout animations, so the tab indicator would become a CSS transition.
4. **GSAP → Motion in the engine is not done.** No phase owns it. The engine only runs inside the old game, which must keep passing e2e until Phase 5. Proposed: do it with the `approach` port in Phase 4.
5. **Route shapes beyond `#ch1`/`#ch2`/`#bonus` were chosen here** (`#learn`, `#progress`, `#settings`, `#<chapter>/<level>`; Settings highlights Home). Confirm or change before Phase 3 links to them.
6. **Noto subset sources include `src/` and `app/`** (UI strings) and all printable ASCII, not only `levels/` + `kb/`. Without this, Japanese UI text and Latin text in the fallback face would mix fonts per glyph.
7. **Size literals not covered by tokens**: 1px hairline borders, 560px content width, 36ch text measure, 2px focus ring, icon stroke widths. Option: add `--hairline`, `--content-max`, `--focus-ring` to `tokens.css` (left unedited because it is the approved file).
8. **Theme choice has no UI or storage.** Tokens support `data-theme`; persisting a choice needs a new storage key, which is outside the preserved-keys list. Decide with Phase 3 Settings.
9. **Noto Sans JP source is a 52 MB (unpacked) dev dependency** (full TTFs, OFL). It adds to `npm ci` time. Alternative: commit the generated subsets and regenerate only when content changes.

### Phase 2: what exists

- `src/logic/`: pure TypeScript, no DOM. `chapter1.ts` (sort, plate, signal, stoppos, bans, approach, tf), `chapter2.ts` (lanes, kerb, route choices), `bonus.ts` (match, build), `run.ts` (order, first-try scoring, review queue), `track.ts` (same storage keys, shapes and item-key hash), `cite.ts` (citation data), `label.ts`. Type-only syntax (`erasableSyntaxOnly`), so Node runs it directly.
- Parity is proven, not assumed: `tools/golden-old.py` drives the **old UI** in Chromium and records its verdict and explanation for every item × every answer a player can give (967 answers over 176 items), plus tracking storage after a scripted answer sequence, citations for every rule, and the e2e suite's drawn routes. `tests/logic/golden.json` holds the results with its own copy of each item and the KB, so it outlives the old app. `tests/logic/golden.test.mjs` requires byte-identical explanations.
- `tests/logic/run.test.mjs` replays the e2e expectations for scoring (cards = n (+1 review), score = n (−1 review)) and checks order, retry, requeue, Next/Finish, match options and build tiles.
- Mutation check run once: altering the stop window, item hash, first-try rule, review rule, kerb hold zone or citation filter each fails the suite.
- Explanations stay HTML strings (with `<b>`, `<ruby>`) exactly as before; the React layer renders them. The old "Listen" button is no longer inside the text: `judgeMatch`/`judgeBuild` return `listen` (text to speak) instead.
- Known quirk kept for parity: when storage throws (private mode), a save is treated as "storage full" and drops the oldest half of the sessions, so in-memory history empties after each answer.

## Known risks

- Rewriting 13 mechanics: mitigated by porting the e2e suite first and keeping the old app live until parity.
- `file://` use ends (build step required).
- Bundle: React + ReactDOM + Motion adds roughly 70 KB gzipped (estimate; measure in CI).
