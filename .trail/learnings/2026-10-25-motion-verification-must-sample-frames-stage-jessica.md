---
title: Motion verification must sample frames; stage checks missed paused intro illustrations
author: Jessica
date: 2026-10-25
branch: Jessica-mak/stream-a
cost: { minutes: 29, tokens: 39552 }
id: l-892f1cc5
scope: repo
status: active
touches:
  - reports/Drug repurposing ranking improvements.md
  - research_notes/Drug repurposing ranking improvements/benchmarks_leakage.md
  - research_notes/Drug repurposing ranking improvements/kg_ml_methods.md
  - research_notes/Drug repurposing ranking improvements/llm_reranking.md
  - research_notes/Drug repurposing ranking improvements/network_medicine.md
  - plan.md
  - jury/pilot.py
  - results/juror_bakeoff/protocol.md
  - results/juror_bakeoff/protocol_frozen.json
  - results/juror_bakeoff/results.json
---

## Decided
The static-animation report reproduced in web/prototypes/motion-check.mjs with a visible first-screen SVG signal: two samples 650 ms apart both had transform none, opacity zero and running false. Story's initial state was paused; Atlas/Workbench never enabled the running prop. Direct workflow-tab navigation also bypassed tour.start().

useIllustrationPlayback in web/src/prototypes/hooks.ts now starts first-screen motion, respects reduced motion and visibility, and powers shared pause/resume controls. All three changeTab functions start the workflow on entry and pause it on departure. SVG CSS retains animations with animation-play-state rather than removing them, so pause freezes the current frame. Atlas gets visible moving signals along its recorded drug-target links.

## Tried and ruled out
The existing 175 browser checks passed before the report because they manually started playback and asserted workflow state. That did not verify visible moving frames. Keep the new actual-transform and opacity assertions as well: all 30 motion checks now pass, including pause/resume, automatic workflow entry and reduced-motion/manual operation.

## Watch out
Static screenshots cannot establish playback. The paired images in .context/motion/ are two moments after the fix, not before/after implementations. Do not override a user's reduced-motion preference silently or claim their device settings are known. Each design stays one page with three in-page tabs; the picker compares whole-site alternatives.
