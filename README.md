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

## Chapters

| Game ch. | 教則 section | Topic | Status |
|---|---|---|---|
| 1 | 第1章 第2節 | Signals, signs and markings | Done |
| 2 | 第5章 第2節 | Where cars may drive | Next |
| 3 | 第5章 第3節 | Protecting pedestrians, crosswalks | Planned |
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
js/game.js       state, level runners, progress saving
```

Scripts are plain classic scripts loaded in order and share top-level constants, so the page runs from `file://` without a bundler.

Signs are simplified drawings, not to official proportions.
