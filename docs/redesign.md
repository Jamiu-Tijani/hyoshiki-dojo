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

## Must be preserved

- All 13 mechanics and their judging: `sort`, `plate`, `signal` (path + hold), `stoppos`, `bans`, `approach` (Pixi), `tf`, `lanes` (path), `kerb` (path + hold), `match`, `build`. 225 items.
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
2. **Logic extraction**: move judges, scoring, queues and tracking into `src/logic` with unit tests (Vitest) that replay the current e2e expectations.
3. **Screens**: Home, Learn, Chapter, Progress, Settings.
4. **Mechanics**: port one at a time behind the shared `QuestionScreen` + `FeedbackSheet`; e2e runs against the React build after each.
5. **Cut-over**: React app becomes `/`; old files removed; README updated.
6. **Validation**: build, typecheck, Vitest, e2e (engine on/off), axe accessibility scan, manual phone check list.

## Known risks

- Rewriting 13 mechanics: mitigated by porting the e2e suite first and keeping the old app live until parity.
- `file://` use ends (build step required).
- Bundle: React + ReactDOM + Motion adds roughly 70 KB gzipped (estimate; measure in CI).
