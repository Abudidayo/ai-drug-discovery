---
title: Rank heatmaps need a few colour tiers; one blue step per rank is too close to tell apart
author: Jessica
date: 2026-10-24
branch: Jessica-mak/hackathon-build-plan
cost: { minutes: 1, tokens: 1835 }
id: l-d56e2b8f
scope: repo
status: active
replaces: l-7da68e2f
touches:
  - plan.md
---

## Tried and ruled out
- Colouring each rank with its own blue step (eight steps from 700 to 250) in a jury rank heatmap. The dataviz palette validator failed it: adjacent lightness gaps of about 0.047, below the 0.06 minimum, in light and dark mode.

## Watch out
- Group ranks into four tiers (for example 1–2, 3–4, 5–6, 7–8, or wider bins for 15-drug panels) and print the exact rank in each cell. Blue steps 700/550/400/250 (light) and 100/250/400/600 (dark) pass the ordinal checks.
