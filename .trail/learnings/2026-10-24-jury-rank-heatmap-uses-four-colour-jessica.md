---
title: Jury rank heatmap uses four colour tiers; eight blue steps are too close to tell apart
author: Jessica
date: 2026-10-24
branch: Jessica-mak/hackathon-build-plan
cost: { minutes: 7, tokens: 76874 }
id: l-7da68e2f
scope: repo
status: active
touches:
  - prototypes/results-visualisation.prototype.html
  - plan.md
---

## Decided
- The jury heatmap colours ranks in four tiers (1–2, 3–4, 5–6, 7–8) and prints the exact rank in each cell. Light mode uses blue steps 700/550/400/250; dark mode reverses to 100/250/400/600, so rank 1 is lightest. Both pass the dataviz ordinal checks.

## Tried and ruled out
- One blue step per rank (eight steps from 700 to 250). The palette validator failed it: adjacent lightness gaps were about 0.047, below the 0.06 minimum, in both light and dark.

## Watch out
- Headless Chrome screenshots catch the list's reorder animation mid-move unless the first render skips it, as `setMode(mode, false)` does in the prototype.
