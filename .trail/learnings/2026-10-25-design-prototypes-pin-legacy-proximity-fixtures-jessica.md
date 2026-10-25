---
title: Design prototypes pin legacy proximity fixtures; never label those ranks as RWR
author: Jessica
date: 2026-10-25
branch: Jessica-mak/stream-a
cost: { minutes: 26, tokens: 21639 }
id: l-2dc1c507
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
The judge-first laptop exploration lives at web/prototypes/ and web/src/prototypes/. Its original web app and api/oxhack_api/fixtures were imported from workstream C commit 598013f, not an automatically tracking branch tip. All 142 imported original files were checked byte-for-byte against that snapshot. The remote branch advanced to 91887ef during the session; importing its later schema changes midway would have mixed integration contracts into a design comparison.

The current 10 physical-RWR + 5 direct-evidence application policy is explained from main's ranking/SHORTLIST_HANDOFF.md and the user's Devpost draft. The prototype table and rank animation deliberately retain labelled fictional legacy proximity scores and AI reviews. Keep the policy explanation separate from that demonstration dataset.

## Tried and ruled out
Relabelling the fixture's network rank as RWR would invent an RWR result. Baricitinib is a known teaching reference here, not a new discovery. A recorded ligand conformer is shown as a drug structure, not a fabricated docking pose.

## Watch out
When promoting the user's chosen variant, connect the current application selection contract and preserve distinct RWR/proximity fields. Protein paths explain proximity, not RWR diffusion or causal mechanism. The prototype skill requires a user selection before production integration. The three-tab concepts are alternatives, not an approved final design system. The picker uses its permitted top position in reserved header space because bottom placement obscured table cells in laptop captures.
