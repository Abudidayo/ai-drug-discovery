# Complete website directions

An isolated, local comparison of three complete single-page websites for hackathon judges. Each has **Problem & solution**, **Workflow**, and **Results** tabs. No design is selected for production yet.

The user clarified that [SEGESTA](https://dribbble.com/shots/7012226-S-E-G-E-S-T-A) is an animation/storytelling reference, not a request for mountain or city scenery. Their researcher-at-a-microscope reference guided Horizon's original laboratory illustration.

## Preview

From `web/`:

```sh
npm run dev -- --config prototypes/segesta/vite.config.js --host 127.0.0.1 --port 5175 --strictPort
```

Open <http://127.0.0.1:5175/prototypes/segesta/>. Use the picker or **1 / 2 / 3**, **left / right arrows**, and **R** to replay the full website. `?v=1`, `?v=2`, and `?v=3` persist the direction on reload. Shortcuts are ignored in text fields. The standard picker uses its permitted top position, in a reserved neutral shelf, so it does not cover tables or workflow controls.

| Direction | Visual system                                           | Layout and animation                                                                                                                                                                                                      | Tradeoff                                             |
| --------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Horizon   | Plum, peach and mint; Sora display                      | Full-bleed original researcher illustration, drifting camera, microscope inspection, rising flask bubbles and three autoplay story chapters. Spatial network, flowing rank comparison and side-by-side shortlist/details. | Most atmospheric; longer page and more illustration. |
| Specimen  | Green and butter; Newsreader display and DM Sans text   | Scientific field guide with a circular annotated network plate, numbered workflow margin and evidence-first research ledger.                                                                                              | Calm and readable; less cinematic.                   |
| Relay     | Coral and ink; DM Sans display and Instrument Sans text | Persistent left navigation, moving evidence press, orthogonal biology map, animated candidate reordering and a full-width shortlist with details below.                                                                   | Most direct to operate; less immersive.              |

## Functionality and facts

All three share the same four-stage workflow, 15 labelled example candidates, filtering by compound/protein, five sort modes, candidate evidence links, recorded independent AI review, recorded molecular structures with a rotation slider, and CSV export of the filtered rows. Empty searches and missing molecular structures have explicit states.

Explanatory animations autoplay. Pause freezes the current frame; replay restarts the explanation. Workflow stages and Horizon's story chapters remain manually selectable. Device reduced motion disables moving scenes and automatic stage progression. Hidden browser tabs suspend motion and timers.

The examples import the same pinned COVID-19 fixtures as the other local explorations. Ranks, scores and AI reviews are fictional and reflect the legacy proximity workflow. The current app uses 10 physical-network RWR plus 5 supported direct-evidence candidates with deduplication/refill and possible coverage shortfalls; see `ranking/SHORTLIST_HANDOFF.md`. Protein paths do not explain RWR scores or prove efficacy. Molecular rotation shows a recorded compound conformer, not a docking pose. This prototype does not run live APIs, save experiments or perform docking.

Production entries and previous prototype rounds are unchanged. Only `web/src/prototypes/segesta/` and `web/prototypes/segesta/` belong to this exploration. It reuses local fonts, fixture adapters, icons, the molecule viewer and reduced-motion helper. The original lab asset was generated with the built-in image tool; its exact prompt is in [`laboratory.jpg.json`](../../src/prototypes/segesta/assets/laboratory.jpg.json) and embedded in the JPEG. No mountain asset or watermark-edited stock asset is shipped.

## Checks

From `web/`:

```sh
npx tsc -b
npx eslint src/prototypes/segesta --max-warnings=0
npx prettier --check src/prototypes/segesta prototypes/segesta
npx vite build --config prototypes/segesta/vite.config.js
node prototypes/segesta/verify.mjs
```

The browser script samples actual rendered transforms before and after playback, verifies pause/replay, all tabs/stages, filtering, sorting, candidate details, molecule rotation, CSV, picker keys and persistence, console errors, reduced motion and layout overflow. It records full-page and laptop captures under `.context/segesta/` and a structured result at `.context/segesta/verification.json`. The isolated build goes to `.context/segesta-dist/`.

After a selection, integrate the chosen design with the existing app's disease selection, live ranking responses, history and optional docking. Keep proximity and RWR fields separate, preserve loading/error/missing-data states, and retire the unused prototypes only after the selected implementation is accepted.
