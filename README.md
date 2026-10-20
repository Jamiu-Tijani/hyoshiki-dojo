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

### Not yet verified against primary text

- The wording of the yellow-light exception and the flashing-light rules (施行令 第2条) comes from secondary sources.
- The abbreviation 大貨 (付表4) was not checked against the source table.
- **Chapter 2 as a whole.** The published 教則 PDF can't be read past 第4章, so Chapter 2 uses the Road Traffic Act articles that 第5章第2節 restates (第17条, 第18条, 第20条, 第20条の2), as summarised in driving-school study material and police guidance. Two rules rest on general knowledge, not on a source I read: a yellow centre line still lets you go round an obstruction (2.1), and a yellow lane line bans lane changes (2.2, 第26条の2). Both say "check against your textbook" in the game.

## Chapters

| Game ch. | 教則 section | Topic | Status |
|---|---|---|---|
| 1 | 第1章 第2節 | Signals, signs and markings | Done |
| 2 | 第5章 第2節 | Where cars may drive | Done |
| 3 | 第5章 第3節 | Protecting pedestrians, crosswalks | Next |
| 4 | 第5章 第4節 | Speed and following distance (incl. 30 km/h change) | Planned |
| 5 | 第5章 第7節 | Intersections and turns | Planned |
| 6 | 第5章 第8節 | Parking and stopping | Planned |
| 7 | 第5章 第5–6節 | Lane changes and overtaking | Planned |
| 8 | 第6章 | Railway crossings, hills, night, bad weather | Planned |
| 9 | 第7章 | Expressways | Planned |

## Layout

```
index.html       page shell
css/style.css    theme tokens (light/dark) and layout
js/render.js     sign artwork, signal heads, road scenes
levels/ch1.js    Chapter 1 scenario data, with source refs
levels/ch2.js    Chapter 2 scenario data (lane scenarios are pure data)
js/game.js       state, level runners, progress saving
```

Scripts are plain classic scripts loaded in order and share top-level constants, so the page runs from `file://` without a bundler.

Each `levels/chN.js` pushes one object onto `CHAPTERS`. A level's `kind` picks its mechanic in `js/game.js`: `sort`, `plate`, `signal`, `stoppos` (Chapter 1), `lanes`, `kerb` (Chapter 2). New lane scenarios need no code: describe the lanes, markings and objects in data. Link to a chapter with `#ch2`. Progress is saved per chapter in the browser.

Signs are simplified drawings, not to official proportions.
