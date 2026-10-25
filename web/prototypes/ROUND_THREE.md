# Half Life — selected Keynote website

This round lives on `Jessica-mak/website-design-exploration`, created from `origin/main`. The user selected Keynote; the other two active designs and comparison picker have been removed. The original application entry and routes are unchanged.

Run from `web/`:

```sh
npm run dev -- --config prototypes/vite.config.js --host 127.0.0.1 --port 5174 --strictPort
```

Open http://127.0.0.1:5174/prototypes/. It renders the selected Half Life website directly. Legacy `?v=` comparison parameters are removed on load. Story chapter controls, pause/play and replay remain available within the website.

The selected website contains Problem & solution, Workflow and Results within a single page. The supplied `.context/attachments/hflvcA/image.png` is a style reference for three original generated layers: a scientist, laboratory background and microscope. The website composes these layers and animates the pipetting forearm, falling sample, sample ripple, microscope illumination and monitor signals. The supplied picture itself is not rendered. Original PNGs, transparent WebP delivery assets and the complete built-in image generation prompts are saved in `src/prototypes/round-three/assets/lab/`. The four-part story moves from the lab into its background monitor, shows the 10–15-year development journey, animates the narrowing of potential compounds, and returns to a question about existing medicines. The problem headline and explanation remain fixed and visible. Camera travel uses interruptible Web Animations API transforms on an HTML layer in fixed illustration coordinates; a separate resize projection fits that layer to its viewport, avoiding animated SVG geometry recalculation. Internal illustration loops briefly hold during camera travel and resume on arrival; CSS handles the illustrative motion. Pause preserves the current scene time. Pointer chapter selection moves the camera over 900ms with a responsive ease-out and keeps the explanation playing. Automatic story travel retains its 1600ms cinematic curve. Rapid selections retarget from the current visible frame. Keyboard selection and reduced-motion navigation remain immediate. The three floating evidence boxes have been removed. Development-time and compound-screening statements link to GAO and FDA primary sources. Visible pause/play and replay controls, manual story navigation, workflow stage selection, and device reduced-motion handling remain available.

Candidate interactions include search, sorting, five/all rows, selection, evidence sources, independent AI reviews, molecular rotation and CSV export. These interactions use the same local fixture and shared model. Rankings, numerical scores and AI reviews in that fixture are fictional and reflect the legacy proximity workflow, not current RWR output. The current policy remains up to 10 physical-network RWR candidates plus 5 direct-evidence candidates, deduplicated and refilled subject to coverage. Molecular conformers are drug structures, not validated docking poses. No live API execution or clinical efficacy is implied.

The new files are in `web/src/prototypes/round-three/`. The preview entry at `web/src/prototypes/main.tsx` loads this round. Fieldnotes.tsx and Signal.tsx and their style rules were removed from this active round. The original application entry is unchanged; selection of Keynote does not replace the application with an unfinished workflow animation.

Validation commands:

```sh
npm run typecheck
npx eslint src/prototypes/round-three src/prototypes/main.tsx --max-warnings=0
npx prettier --check src/prototypes/round-three src/prototypes/main.tsx prototypes/round-three-check.mjs
npx vite build --config prototypes/vite.config.js
node prototypes/round-three-check.mjs
node prototypes/problem-story-check.mjs
node prototypes/chapter-motion-check.mjs
```

The browser check samples actual generated-character arm and monitor transforms, falling-drop visibility, pause state for all illustrated layers, pause/resume, timed story progression, workflow progression, manual stages, reduced motion, removal of comparison controls and legacy URL cleanup, search and empty results, sorting, candidate details and CSV download. It saves the three tab captures and measurements under `.context/website-designs/`. The preview server origin can be overridden with `PROTOTYPE_ORIGIN`.

Motion reference: SEGESTA by Zak Steele-Eklund / Studio VØR (https://dribbble.com/shots/7012226-S-E-G-E-S-T-A). Studied its continuous camera travel, foreground/background depth and readable holds. Its scenery and visual identity are not used. Reference samples remain private in `.context/motion-study/`.

Keynote’s opening is now a full viewport illustration (`100svh`) with no white surround or comparison banner. The headline, three-tab navigation, chapter controls and playback controls overlay the artwork. The comparison picker and the two unselected directions are removed. The SVG fills the viewport without letterboxing; Keynote’s camera framing keeps the monitor clear of the fixed introductory copy.

For rendering diagnostics, `MOTION_LABEL=after node prototypes/lab-performance.mjs` records a local 2.5-second Chrome trace at 1440×900, 2× pixel density and 4× CPU throttling in `.context/chapter-motion/`. `MOTION_ISOLATE=camera` freezes internal illustration loops to isolate camera cost. These synthetic measurements describe local rendering work, not guaranteed frame rates on every device. The click regression samples actual intermediate frames, rapid retargeting, pause/resume, compound refocusing and reduced motion.

Keynote’s introduction hides the top-right three-tab strip to keep the scene clear. Its outlined play/text actions open Workflow and Results; the three-tab navigation is available on those views. Introductory body copy scales from 16px to 19px across laptop sizes, and the actions use transparent backgrounds and a fine play ring rather than a filled block.

The main Workflow tab now renders the updated full-screen Story / Technical experience. The shared React implementation lives in `Workflow.tsx`, `WorkflowDetails.tsx`, `workflow-content.ts` and scoped `workflow.css`. The review URL mounts the same component through `src/prototypes/workflow-review.tsx`; there is no second controller or global review stylesheet to drift. Header navigation connects all three site tabs. Sources & methods is in the lower-right of the workflow.

Workflow chapters cover biological associations, candidate selection, the evidence trail, the AI jury, and TigerData persistence. The evidence inspector retains all 18 source statements and exact model wording from the archived example. Optional docking details remain available. Approved story stills remain stills; this integration does not claim the planned narrative animations are implemented. `useSite` keeps the obsolete four-stage tour paused, and `tab`, `view`, and `stage` retain the selected page and chapter across reloads.

Technical mode is now a single complete overview, rendered by `TechnicalOverview.tsx`, rather than five stages. Its one connected map includes sources, gene joins, ranking, evidence construction, the three-model jury, validation, candidate comparison, TigerData and optional docking. The Technical URL removes `stage`; the Story view retains its five chapters. The exact evidence and docking dialogs remain on the page. Overview validation and viewport evidence are in `.context/technical-overview/`.

The single-page workflow shows five steps with RWR, STRING paths, shortlist counts, exact evidence citations, the selected AI jury and Borda comparison visible. Text stays fixed inside its boxes. The original complete technical diagram and longer notes remain under “Technical details” on the same page. There is no lab backdrop. Its autoplaying evidence trail has Pause/Play and Replay controls, pauses in hidden tabs, and switches to a complete static diagram for reduced motion. Run `node prototypes/technical-motion-check.mjs` for its focused browser checks.

Each technical stage now has an SVG explanation of its operation, rather than relying on highlighted text alone. Network paths, shortlist capacities, citation provenance, parallel model reviews and rank comparison remain in the one-page map. Small internal cues share the main autoplay, pause/replay and reduced-motion controls. The source illustration quotes the saved E2 example; other mini-diagrams are schematic.
