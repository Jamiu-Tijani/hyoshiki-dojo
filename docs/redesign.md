# Redesign: React migration plan

Approved 2026-11-08. Source brief: the user's "Premium React Mobile Experience" prompt. This file records the decisions so any session can carry out the build without re-deciding them.

## Decisions

| Area | Decision |
|---|---|
| Stack | Migrate from classic-script JS to **React 19 + TypeScript + Vite**. Hash routing (keeps `#ch1`-style links). Vite stays on 7, so the React plugin is `@vitejs/plugin-react` 5.x (6.x needs Vite 8; upgrading is a separate change). *(2026-11-08)* |
| Routes | `#` Home, `#learn`, `#progress`, `#settings`, `#ch1` `#ch2` `#bonus` → Chapter (Learn tab), `#<chapter>/<level>` → Level (focused). Unknown → Home. Settings highlights Home. *(Approved 2026-11-08.)* |
| Motion | **Motion for React** via `LazyMotion` + `domAnimation` (`m.*` components; no layout animations, which cost 14 KB gzipped). Replace GSAP in the Pixi engine with Motion's `animate` in **Phase 4**, with the `approach` port: until then the engine serves only the old game. *(2026-11-08)* |
| Icons | **Lucide React**, tree-shaken. |
| Tokens | `src/styles/tokens.css` (palettes, type, space, shape, depth, motion). No other colour or size literals in components. Layout and line tokens added in Phase 1: `--content-max`, `--measure`, `--hairline`, `--focus-ring`, `--icon-stroke(-active)`. A user theme choice (`data-theme`) needs a new storage key: decided with Phase 3 Settings. |
| Fonts | Plus Jakarta Sans (display), Satoshi (body), Noto Sans JP subset to the glyphs in `levels/` + `kb/`; fallbacks Hiragino Sans → Yu Gothic UI → system-ui. Self-hosted, fetched and subset in CI. Tabular numerals for all numbers. Subset sources also include `src/` + `app/` (UI strings) and all printable ASCII. Subsets are generated on every build, not committed (the Noto source package adds ~1 s to CI install). **Satoshi: open, see Phase 1 status.** *(2026-11-08)* |
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
| 1 Scaffold | **Done** (2026-11-08) | See below. Decisions resolved except Satoshi (licence; see below). |
| 2 Logic extraction | **Done** (2026-11-08) | See below. |
| 3–6 | Not started | |

### Phase 1: what exists

- **App beside the old game**: `app/index.html` → `src/main.tsx` → `src/App.tsx`, built by `vite.app.config.ts` into `dist/app/` (relative URLs, so it works under the Pages project path). Old game unchanged at `/`. `npm run dev` serves both (`/` old, `/app/` new). `npm run build` = kb check → clean `dist/` → engine → fonts + app → assemble (fails if either build is missing).
- **Packages** (pinned in `package-lock.json`): react / react-dom 19.3.1, motion 14.10.1, lucide-react 1.70.0; dev: @vitejs/plugin-react 5.2.0, @types/react(-dom) 19.3.0, subset-font, @fontsource-variable/plus-jakarta-sans, @expo-google-fonts/noto-sans-jp.
- **Routing**: `src/route.ts` (pure) + `src/useRoute.ts`. `#` Home, `#learn`, `#progress`, `#settings`, `#ch1` `#ch2` `#bonus` (same deep links as the old game) → Chapter under the Learn tab, `#<chapter>/<level>` → Level (focused, no tab bar). Unknown → Home. Focus moves to the new `h1` after navigation; `document.title` follows the route.
- **Shell**: `BottomTabBar` (Home · Learn · Progress, `aria-current`, Lucide icons, CSS highlight), `PageHeader`, `IconLink`, `EmptyState`. Every route renders a placeholder that names the phase that builds it and links to the same chapter in the old game. No content or statistics are invented.
- **Tokens**: `tokens.css` unchanged; `base.css` applies them (background, text, fonts, tabular numerals on `body`, focus ring in `--primary`). Motion reads `--dur-*` / `--ease-*` from the tokens (`src/motion.ts`); `MotionConfig reducedMotion="user"`.
- **Fonts**: `tools/fonts.mjs` runs on every app build (CI included) from npm packages: Plus Jakarta Sans variable (latin + latin-ext) and Noto Sans JP 400/700 subset to every character in `levels/`, `kb/`, `src/`, `app/` plus printable ASCII (420 glyphs, 84 KB per weight). Output `src/styles/fonts/` is git-ignored.
- **src/logic**: not imported yet; Phase 1 has no game rules. Screens and mechanics must use it (no judging in components).
- **Tests added**: `npm run test:app` (`tests/app/route.test.mjs`, 5 tests, `node:test`) and `tests/app_smoke.py` (Playwright, 390×844, reduced motion): tabs, deep links, focused route, unknown hash, focus after navigation, both fonts loaded, tabular numerals, light/dark `--bg`, no horizontal overflow, link to the old game, no console errors. Both are in CI. Mutation check: removing the fonts import or the `bonus` route fails both suites.
- **Measured bundle** (`gzip -9`, as CI reports it): app entry JS 104 KB with `LazyMotion` + `domAnimation` (118 KB with the full `motion` component; React + ReactDOM alone 67, Lucide 5.5), CSS 2.4 KB, fonts 218 KB (woff2). CI's bundle report lists `dist/app/assets/*.js`.

### Phase 1: decisions

Resolved 2026-11-08 (approved by the user) and recorded in the Decisions table: plugin-react 5.x on Vite 7; route shapes; LazyMotion (app entry measured below); GSAP → Motion moved to Phase 4; Noto subset sources; layout tokens; theme choice deferred to Phase 3; font subsets stay generated in CI (measured: `npm ci` 3 s → 4 s with the Noto package, so committing subsets is not worth it).

**Open: Satoshi.** The Fontshare Free Font EULA (Indian Type Foundry, last updated 22 March 2021) allows web use, but section 02 forbids "uploading them in a public server" and transmitting the fonts "over the Internet in font serving" without ITF's written consent; its sanctioned web route is delivery from ITF's servers. So it cannot be committed to this public repo or self-hosted from Pages without that consent. Body Latin text currently uses Noto Sans JP Subset (next in the stack). Choices:
1. Keep Noto Sans JP for body text (no change; Latin and Japanese match).
2. Replace Satoshi with an OFL face self-hosted from npm (a design choice).
3. Load Satoshi from Fontshare's servers (breaks "self-hosted"; third-party request on every visit).
4. Ask ITF for written consent to self-host.

## Known risks

- Rewriting 13 mechanics: mitigated by porting the e2e suite first and keeping the old app live until parity.
- `file://` use ends (build step required).
- Bundle: measured 2026-11-08, React + ReactDOM alone are 67 KB gzipped (the earlier ~70 KB estimate for React + Motion was low). See the Phase 1 bundle line for the app entry.
