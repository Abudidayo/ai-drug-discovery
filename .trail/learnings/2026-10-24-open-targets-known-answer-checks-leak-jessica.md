---
title: Open Targets known-answer checks leak through clinical evidence
author: Jessica
date: 2026-10-24
cost: { minutes: 35, tokens: 8599 }
id: l-8f3f1384
scope: repo
status: active
touches:
  - docs/mvp-spec.md
  - demos/data-sources/server.mjs
---

## Watch out
- The COVID-19 (MONDO_0100096) × baricitinib known-answer check is circular. `drugAndClinicalCandidates` lists baricitinib with 22 clinical reports, and JAK2's COVID-19 association (0.419) comes only from `clinical_precedence` and `europepmc`. Removing the disease's own drugs is not enough: zero the `clinical_precedence` datasource as well.
- The overall association score can be reproduced client-side: sort the weighted datasource scores, sum (w·s)/i², then divide by π²/6. This matched the API to 0.0000 on all 8,235 COVID-19 and 5,341 myeloma rows (release 26.09), so ablation and re-weighting can run offline from one bulk fetch.
- The server-side `datasources:` argument replaces the whole weight table rather than patching it. Passing only `clinical_precedence: 0` resets every other source to 1.0. Pass the full default list with the override, or re-score client-side.
- With clinical evidence zeroed, baricitinib falls to 22nd, because Open Targets' curated mechanism lists only JAK1 and JAK2. Adding ChEMBL bioactivity edges (median pChEMBL ≥ 7) gives it TYK2, which is rank 2 on genetics, and that brings it back to joint first.
- In oncology, `cancer_biomarkers` evidence rows name the drug (myeloma × BCL2 reads "BCL2 overexpression / VENETOCLAX"). Drop that source too in myeloma backtests. Venetoclax still surfaces via BCL2.
- Multiple myeloma is now MONDO_0009693; EFO_0001378 returns null.
- `maximumClinicalStage: APPROVAL` includes ATC/TTD-only claims; navitoclax shows as approved but never was. Filter on regulator report sources (FDA, EMA, PMDA, DailyMed).
