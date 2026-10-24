---
title: TxGNN is not a cheap extra ranking column
author: Jessica
date: 2026-10-24
branch: Jessica-mak/hackathon-build-plan
cost: { minutes: 12, tokens: 123319 }
id: l-bbdc9073
scope: repo
status: active
touches:
  - plan.md
  - oxhack_rgcn_integrated_plan.md
---

## Watch out
- For the TxGNN-as-extra-column idea in plan.md and oxhack_rgcn_integrated_plan.md: TxGNN (Nat Med 2024, github.com/mims-harvard/TxGNN, MIT, last commit 6 May 2024) publishes no per-disease ranking table. The only ranking source, the TxGNN Explorer at txgnn.org, returned HTTP 503 on 24 Oct 2026 (Wayback shows it up until 5 Apr 2026). Getting scores means running Python 3.8 + DGL 0.5.2 + CUDA with the README checkpoint, a public Google Drive file TxGNNExplorer_v2.zip of 1.5 GB (reproduce checkpoints: checkpoints_all_seeds.zip, 199 MB).
- Its graph files come from Dataverse doi:10.7910/DVN/CNQV69 (CC0, files dated 7 Jun 2023), but drug nodes are DrugBank IDs, and DrugBank academic data is CC BY-NC 4.0. Treat outputs as non-commercial research use.
- Its nodes.tab has plasma cell myeloma (MONDO 9693) and type 2 diabetes mellitus (MONDO 5148), unlike the KG-Bench graph. It lacks sotorasib, adagrasib, teclistamab and deucravacitinib.
- Open TxGNN issues #25 and #29 report AUPRC far below the paper with the shipped checkpoints (#29: 0.032 vs 0.437 published); no author reply.
- So keep the deterministic Open Targets evidence score as the ranker in plan.md; add TxGNN only as a time-boxed stretch on a Linux GPU box, labelled as a graph-model guess, not evidence. Sources in research_notes/OxHack 26 drug repurposing plan/current_repurposing_practice.md.
