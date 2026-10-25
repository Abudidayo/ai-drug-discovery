# Design prototypes

> Selected website: **Half Life, using Keynote**. Open http://127.0.0.1:5174/prototypes/ and see [ROUND_THREE.md](ROUND_THREE.md) for the current surface and checks. Fieldnotes, Signal and the active comparison picker were removed after selection.

## Historical exploration

The original round below is retained as historical context; its picker instructions do not describe the selected website.

Three interactive alternatives for hackathon judges seeing the project for the first time. Each has the same three main tabs: **Why it matters**, **How it works**, and **Results**. The current brief prioritises laptops; phone design is outside this pass.

Each alternative is one single-page website: its three tabs switch content within the same route. The three picker entries are alternative website designs.

All visual decisions below remain provisional until the user chooses a variant. This comparison does not establish an approved design system.

## Run locally

From the repository root:

```sh
cd web
npm ci
npm run dev -- --config prototypes/vite.config.js --host 127.0.0.1 --port 5173 --strictPort
```

Open [the prototype picker](http://127.0.0.1:5173/prototypes/). Direct links select [Story](http://127.0.0.1:5173/prototypes/?v=1), [Atlas](http://127.0.0.1:5173/prototypes/?v=2), or [Workbench](http://127.0.0.1:5173/prototypes/?v=3).

The picker sits in reserved space at the top centre of the sticky header. Use **1 / 2 / 3** or **left / right arrows** to switch variants and **R** or the replay button to reset the current variant. The `?v=N` URL preserves the selected variant on reload. Shortcuts are ignored while typing in fields.

## Compare the alternatives

| Variant   | Provisional direction                                                                                                         | Distinctive interaction                                                                                                        |
| --------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Story     | Centred editorial explanation, generous spacing, serif emphasis, pale olive and cream connection diagram                      | A guided narrative introduces the researcher problem before the workflow and candidate evidence.                               |
| Atlas     | Deep navy spatial network explorer, persistent left navigation, blue target/drug context, coral disease context, green routes | A network-led view connects the selected candidate to its target and disease context.                                          |
| Workbench | Compact pale green research desk, persistent disease context, table-first outcomes                                            | Candidate evidence stays close to the table; an expandable, replayable rank-change visualisation explains the example outcome. |

All three include workflow stages with play/pause, candidate filtering and sorting, candidate details, source links, AI review summaries, molecular rotation, and CSV export. These interactions operate on local examples.

## Scope and provenance

The source React application was imported from the initially fetched `origin/abdullah-nextverse/workstream-c` snapshot at commit `598013f`, together with `api/oxhack_api/fixtures/` required for its tests and local demo. All 142 original imported web and fixture files were verified byte-for-byte against that commit, including production `main.tsx` and `routes.tsx`. The remote branch may advance independently; this imported baseline remains pinned to `598013f`. The current workspace branch is retained.

The prototypes live in `web/src/prototypes/`. This directory contains the independent entry, three variants, shared interactions, data adapters, and styles. `web/prototypes/` contains the preview HTML, Vite configuration, and browser verification script. The source application does not import the prototypes. The preview is not connected to live API runs, saving, or docking; the source application's capabilities remain available for integration after a choice.

The previews import the `MONDO_0100096` experiment and jury fixtures. Their ranks, scores, and AI reviews are fictional, explicitly labelled, and reflect the legacy proximity workflow. Recorded network edges and molecular conformers are used; rotating a molecule shows the drug structure rather than a validated docking pose.

The current application policy is `physical_rwr`: 10 physical-network random-walk-with-restart candidates plus 5 direct-evidence candidates, deduplicated and refilled where coverage permits. Incomplete coverage can yield fewer. See [the shortlist handoff](../../ranking/SHORTLIST_HANDOFF.md) and [the application shortlist adapter](../../workstream_b/application_shortlist.py). The fixture table does not demonstrate that policy's output.

Proximity paths provide network context; they do not directly explain RWR scores or prove a mechanism. Three Cortex AI reviewers critique evidence. Optional Docker/Vina docking is a separate step from ranking, and none of these outputs establish clinical efficacy. The supplied scientific reference is [the user's attached text](../../.context/attachments/y2ocre/pasted_text_2026-10-25_05-14-52.txt).

## Provisional visual decisions

The implemented token source is [styles.css](../src/prototypes/styles.css). Story and Workbench inherit shared values and override selected roles; Atlas replaces the palette. These values describe the previews and are subject to the user's choice.

| Role / CSS token                 | Story     | Atlas     | Workbench |
| -------------------------------- | --------- | --------- | --------- |
| Background `--ground`            | `#fff`    | `#101b25` | `#f7f8f4` |
| Surface `--paper`                | `#fff`    | `#17232e` | `#fff`    |
| Text `--ink`                     | `#252a2e` | `#eef2ef` | `#26352d` |
| Secondary text `--muted`         | `#626970` | `#a2b2bf` | `#626c63` |
| Border `--rule`                  | `#e4e6e5` | `#2c3c49` | `#dde2d9` |
| Quiet surface `--soft`           | `#f4f4ef` | `#22313d` | `#f1f2ef` |
| Action `--accent`                | `#526b53` | `#c6dab1` | `#2e695a` |
| Action surface `--accent-soft`   | `#e9efe8` | `#293d37` | `#e9f1eb` |
| Disease `--disease`              | `#b85543` | `#eb9687` | `#b85543` |
| Disease surface `--disease-soft` | `#f7e5dd` | `#4c3738` | `#f7e5dd` |
| Drug / target `--drug`           | `#4b7897` | `#a8c8df` | `#4b7897` |
| Drug surface `--drug-soft`       | `#e6eef4` | `#263e52` | `#e6eef4` |
| Network route `--route`          | `#618376` | `#bed3a7` | `#3d7d69` |
| Caution `--warning`              | `#916129` | `#e6bf83` | `#916129` |
| Caution surface `--warning-soft` | `#faf0dc` | `#3d342a` | `#faf0dc` |

All variants use the installed Instrument Sans Variable for interface text. Story and Atlas add Source Serif 4 Variable for editorial emphasis. The shared base is 15px with a 1.55 line height. Story's overview uses a centred 1176px container and a 48–74px fluid heading; its connection panel has a cream surface (`#f7f7f2`) and 12px corners. Atlas uses tonal layers to organise the dark workspace. Workbench uses compact rows and borders to keep candidate comparisons visible.

Control state transitions use `--duration-quick: 180ms`; press feedback uses a 140ms transform. `--ease-out` is `cubic-bezier(0.23, 1, 0.32, 1)` and `--ease-in-out` is `cubic-bezier(0.77, 0, 0.175, 1)`. Longer explanatory sequences use transform and opacity to show workflow progression and rank changes. The first-screen diagrams autoplay with visible moving signals and a pause/resume control. Opening How it works starts the walkthrough automatically. Switching away pauses the tour, and hidden-tab visibility suspends the intro illustrations. Device reduced-motion preferences are respected and labelled; manual workflow navigation remains available. Play/pause and replay keep the explanation controllable. The picker retains its own styling in `src/prototypes/picker.css`.

## Verify

Run these commands from `web/`:

```sh
npm run typecheck
npm run lint
npx prettier --check src/prototypes prototypes
npx vite build --config prototypes/vite.config.js
npm run build
npm test
```

The prototype build writes to the repository's `.context/prototype-dist/`. `npm run build` checks the original application separately.

With the preview server running, use installed Google Chrome for the browser checks:

```sh
node prototypes/verify.mjs
node prototypes/motion-check.mjs
```

Set `PROTOTYPE_ORIGIN` if the server uses a different origin. The default is `http://127.0.0.1:5173`. Screenshots and downloaded CSV evidence are written to the repository's `.context/` directory.

At this handoff, the commands above passed, including 16 test files / 143 unit tests and 175 browser checks plus 30 motion regression checks. The motion regression samples actual rendered transforms and visibility, checks pause/resume and automatic workflow entry, and covers reduced motion across all three designs. Browser coverage includes all tabs and stages, play/pause, filters, sorting, empty results, unavailable scores, source/review details, molecule rotation, CSV download, picker keys and URL persistence, header non-overlap, and reduced motion. Laptop sweeps cover 1280×800, 1440×900, and 1600×1000, alongside 1440px full-page captures. No runtime or console errors were observed during those checks.

An independent visual review of all nine tab/variant captures identified picker overlap and Workbench’s missing explicit outcome animation. A bounded follow-up review confirmed both fixes resolved and all nine recaptures valid. Final 1440×900 overview captures are `.context/story-laptop.png`, `.context/atlas-laptop.png`, and `.context/workbench-laptop.png`. This is bounded preview verification; live API integration, docking, clinical validity, and comprehensive performance validation remain outside these checks.

## After a choice

1. Record the chosen variant and any requested changes. Promote its confirmed visual decisions into the permanent design documentation at that point.
2. Integrate the chosen interface with the source application's disease selection, API queries, history, saving, and optional docking. Replace sample ranking data with current application responses and retain explicit missing-data and uncertainty states.
3. Re-run application tests and browser checks against the integrated workflow. Verify real response mapping and loading/error states before removing the local-demo labels.
4. Retire the unused alternatives and picker when the integrated interface is accepted. Keep the source provenance and scientific limitations traceable.

No commit, push, deployment, or final visual-system selection is part of this handoff.
