# Round-two website prototypes

Folio, Orbit and Assembly are three complete single-page alternatives for hackathon judges. Each has **Problem & solution**, **Workflow** and **Results**, with the same example and inspection capabilities. They are provisional: no production visual system has been selected. This document records their implemented choices without establishing a project-wide design system.

Open [Folio](http://127.0.0.1:5173/prototypes/round-two/?v=1), [Orbit](http://127.0.0.1:5173/prototypes/round-two/?v=2) or [Assembly](http://127.0.0.1:5173/prototypes/round-two/?v=3). Compare at full size using the top-centre picker. The supported review range is laptop widths **1280–1600px**; phone layouts are outside this round.

## Run and check

Use Node.js 22.22 or newer and install the locked dependencies with `npm ci` in `web/` if needed. Run these commands from `web/`:

```sh
npx vite --config prototypes/round-two/vite.config.js --host 127.0.0.1 --port 5173 --strictPort
```

With that server running, use a separate terminal for the checks:

```sh
npx tsc -p prototypes/round-two/tsconfig.json
npx eslint src/prototypes/round-two prototypes/round-two --max-warnings=0
npx prettier --check src/prototypes/round-two prototypes/round-two
npx vite build --config prototypes/round-two/vite.config.js
node prototypes/round-two/verify.mjs
node prototypes/round-two/motion-check.mjs
```

The browser scripts use installed Google Chrome through Playwright. Set `PROTOTYPE_ORIGIN` when using another origin. The isolated build writes to `.context/round-two-dist/` at the repository root; its entry remains `prototypes/round-two/index.html`.

Keep this route and its [Vite](vite.config.js) / [TypeScript](tsconfig.json) configurations isolated. The shared `web/src/prototypes/main.tsx` currently belongs to concurrent round-three work; do not repoint or restore it to run this round. The source application entry is also separate.

## Controls and shared behaviour

| Control                     | Behaviour                                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------------------------- |
| Picker or `1` / `2` / `3`   | Switch the complete website: Folio / Orbit / Assembly. The `v` URL parameter follows the selection.   |
| Left / right arrow          | Cycle through the three worlds.                                                                       |
| Picker replay or `R`        | Remount the current world, resetting it to Problem & solution.                                        |
| Scene Play / Pause / Replay | Control the current explanatory illustration. Pause freezes its current frame; replay restarts it.    |
| Workflow stages             | Select any of four stages manually; selection pauses the tour. Entry and replay start from stage one. |

Picker shortcuts ignore text fields, selects, editable content and modified key combinations. The three page tabs stay within the single page. Normal motion autoplays on arrival; the workflow advances every 3.6 seconds and stops after its fourth stage. Hidden-tab playback pauses. With `prefers-reduced-motion: reduce`, explanatory animation and automatic stage advancement stop; manual stage controls and replay remain usable.

All three Results views provide drug/protein search, five sort orders, a five-row preview with an expand control, selection, empty-state recovery, evidence/source links, safety context, three illustrative AI reviews, and a recorded ligand structure with rotation controls. Pair comparison uses the same five fields in every world: legacy proximity rank, direct evidence rank, AI review rank, protein targets and safety. The first record follows selection; a second-candidate selector excludes it. CSV export includes the currently displayed rows and a fictional-data notice.

## Implemented visual worlds

These values come from the current [styles and font declarations](../../src/prototypes/round-two/base.css). They describe this prototype surface. Font files and their licences are bundled in `src/prototypes/round-two/assets/`; no remote font request is required.

| World        | Palette tokens                                                                                                          | Type and form                                                                                                                                                                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Folio**    | Ivory background `#f7f3e9`, paper `#fcfaf4`, ink `#302d28`, oxblood accent `#7a3636`, muted `#71695d`, rule `#d5ccbd`   | Newsreader display (`Folio Serif`) with DM Sans body (`Assembly Sans`). Opening headline: `clamp(61px, 4.6vw, 75px)`, weight 400, line-height 0.99; introductory body 13px / 1.8. Square controls, thin rules and a research ledger.               |
| **Orbit**    | Ice background `#f6f9ff`, white paper, ink `#132343`, ultramarine `#244cdb`, muted `#52627c`, rule `#d6e1f2`            | Sora throughout (`Orbit Sans`). Opening headline: `clamp(40px, 3.65vw, 57px)`, weight 550, line-height 1.16; lead 15px / 1.85. Laptop overrides set the headline to 44px at ≤1320px and 57px at ≥1500px. Rounded canvas (28px) and actions (12px). |
| **Assembly** | Warm-white background `#f7f6f0`, paper `#fffef8`, charcoal `#22251f`, yellow `#ead85b`, muted `#64665a`, rule `#d7d8c9` | DM Sans throughout (`Assembly Sans`). Opening headline: `clamp(42px, 3.8vw, 58px)`, weight 550, line-height 1.025; introductory body 15px / 1.7. Square controls, strong rules and a modular process grid.                                         |

**Folio** carries its publication metaphor through an asymmetric opening, converging evidence ribbons, chapter-like workflow scenes and annotated rank ribbons above a ruled results ledger. Its main container caps at 1600px with fluid 44–72px side padding. See [Folio styles](../../src/prototypes/round-two/Folio.css).

**Orbit** carries its geometric diffusion metaphor through concentric signal rings, a workflow canvas with a stage rail, and parallel ranking columns beside a candidate inspector. Its main container caps at 1536px with 48px side padding before laptop overrides. See [Orbit styles](../../src/prototypes/round-two/Orbit.css).

**Assembly** carries its sorting metaphor through scattered records moving into lanes, four visible workflow stations, an animated rank ladder, candidate records and a comparison register. Its main container caps at 1600px with 40px side padding before laptop overrides. See [Assembly styles](../../src/prototypes/round-two/Assembly.css).

### Motion as implemented

The following are authored CSS timings; rendered frame checks separately establish that the diagrams visibly move, freeze, resume and restart. They are not frame-rate or performance measurements.

| World    | Explanatory motion                                                                                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Folio    | Evidence-thread arrival and readout: 5.2s loops; workflow reading loops: 4–6s; result ribbon: 4s. Thread/ribbon easing uses `cubic-bezier(0.65, 0, 0.35, 1)`.     |
| Orbit    | Diffusion and target pulse: 7.2s; candidate pool: 3s; review/evidence flow: 3.6s; ranking travel: 5.2s. Linear travel and eased pulses follow the diagram's role. |
| Assembly | Record sorting: 8.4s; workflow conveyor: 8s; rank-ladder traversal: 4s alternating; rank settling: 7.4s. Sorting uses `cubic-bezier(0.77, 0, 0.175, 1)`.          |

The shared interaction easing is `cubic-bezier(0.23, 1, 0.32, 1)`. Diagram animation uses CSS/SVG targets; React state handles controls and stage boundaries rather than per-frame updates. Reduced motion preserves a static explanatory view and the inspection controls.

## Scientific and source boundaries

The imported React application and fixtures were pinned from the original `origin/abdullah-nextverse/workstream-c` snapshot at **`598013f`**. Round two reuses the shared [prototype data adapter](../../src/prototypes/data.ts) and fixtures under `api/oxhack_api/fixtures/MONDO_0100096/`; its own source is [src/prototypes/round-two](../../src/prototypes/round-two/). Product context is in [PRODUCT.md](../../../PRODUCT.md), with this round's contract in [.context/round-two-direction.md](../../../.context/round-two-direction.md).

The COVID-19 example's numerical ranks, scores and AI reviews are **fictional legacy proximity fixture data**. They demonstrate the interface and do not validate the current shortlist policy. That policy is described separately: **10 physical-network Random Walk with Restart candidates plus 5 direct-evidence candidates**, with deduplication/refill where coverage permits; incomplete coverage can yield fewer. See [the shortlist handoff](../../../ranking/SHORTLIST_HANDOFF.md).

Network diagrams are schematic. Proximity paths provide context and do not explain RWR diffusion scores or prove a therapeutic mechanism. The molecule view uses real recorded ligand conformer coordinates; it is **not a docking pose**. These prototypes do not run live APIs, save experiments or execute docking. Rankings, model reviews and optional future docking remain research hypotheses requiring experimental validation.

## Recorded verification

Local evidence from the completed round-two run:

- [Browser verification](../../../.context/round-two/verification.json): **260 checks passed** at widths 1280, 1440 and 1600; no captured runtime errors. Coverage includes navigation, picker/URL behaviour, search, sorting, selection, comparison parity, details, exports and layout collisions.
- [Motion verification](../../../.context/round-two/motion/results.json): **183 checks passed**, including 18 normal-motion scenes (problem, four workflow stages and results in each world), rendered-frame pause/resume/replay checks, and reduced-motion behaviour in all three tabs; no captured runtime errors. Paired frame images are saved alongside the JSON.
- [Mechanical design detector](../../../.context/round-two/detector.json): returned `[]`.

Scoped TypeScript, ESLint with zero warnings, Prettier and the isolated Vite build passed. Independent review marked the comparison-parity and critical-readability fixes resolved at all three widths, with no regressions found in that fix batch. This is scoped prototype verification; a production design choice and integration are still pending.
