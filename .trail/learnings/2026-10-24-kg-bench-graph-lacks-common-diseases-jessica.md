---
title: "KG-Bench graph lacks common diseases and post-2021 drugs, and ships no trained weights"
author: Jessica
date: 2026-10-24
branch: Jessica-mak/hackathon-build-plan
cost: { minutes: 3, tokens: 611695 }
id: l-e342c0e0
scope: repo
status: active
touches:
  - oxhack_rgcn_integrated_plan.md
  - plan.md
---

## Watch out
- KG-Bench's shipped graph (github.com/cmbi/Benchmark_GNN_OpenTargets, `processed_data/tables/processed_diseases.csv`) keeps only the most specific disease terms. Its 9,339 disease nodes include "asymptomatic myeloma" (EFO_0003073), but multiple myeloma is absent under both EFO_0001378 and MONDO_0009693. Type 2 diabetes, Alzheimer's disease and rheumatoid arthritis are also absent; only their subtypes are present. COVID-19 (MONDO_0100096) is present. Checked on 24 Oct 2026.
- Its 1,966 drug nodes stop around mid-2021: adagrasib, sotorasib, deucravacitinib and teclistamab are absent. Baricitinib, erdafitinib, pemigatinib, venetoclax and lenalidomide are present.
- The repo ships edge tensors (`processed_data/edges/*.pt`) but no trained model weights, so an RGCN must be trained before it can score anything.
- Consequence for the RGCN-first plan: most student disease searches, including the myeloma worked example, map to no graph node unless the searched disease is mapped down to its descendant leaf terms. Newer drugs can never be shortlisted by the graph.
