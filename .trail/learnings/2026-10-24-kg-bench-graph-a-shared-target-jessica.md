---
title: "KG-Bench graph: a shared-target count reaches AUC 0.85 with no model, and trial evidence can leak into its test"
author: Jessica
date: 2026-10-24
branch: Jessica-mak/hackathon-build-plan
cost: { minutes: 6, tokens: 109767 }
id: l-817d5c30
scope: repo
status: active
touches:
  - reports/OxHack 26 drug repurposing plan.md
  - research_notes/OxHack 26 drug repurposing plan/arxiv_2601_11560.md
  - research_notes/OxHack 26 drug repurposing plan/arxiv_2608_12395.md
  - research_notes/OxHack 26 drug repurposing plan/benchmark_btag159.md
  - research_notes/OxHack 26 drug repurposing plan/cloud_gpu_b200_b300.md
  - research_notes/OxHack 26 drug repurposing plan/docking_feasibility.md
  - research_notes/OxHack 26 drug repurposing plan/hackathon_prizes_hrt.md
  - research_notes/OxHack 26 drug repurposing plan/open_targets_chembl_data.md
  - research_notes/OxHack 26 drug repurposing plan/sponsor_stack.md
  - research_notes/OxHack 26 drug repurposing plan/youtube_MpUTfZpiePM.md
---

## Watch out
- KG-Bench (Wei et al., Bioinformatics 2026, doi:10.1093/bioinformatics/btag159; code github.com/cmbi/Benchmark_GNN_OpenTargets at 9bcfd7c) builds disease–gene edges from the 21.06 `associationByOverallDirect` table. It keeps every pair with score >= 0.01 and applies no datasource filter (scripts/1_create_graph.py:65 and :452). That overall score counts ChEMBL clinical-trial evidence, while drug–disease edges use `approvedIndications` only. A drug in a 2021 trial for a disease therefore already links its target to that disease, and its 2023/2024 approval then counts as a "new" test link two hops away. Same trap as the baricitinib × COVID-19 known-answer check. The effect on their reported test scores is not measured: validation and test pairs are not shipped.
- In the shipped `processed_data/`, 71.1% of the 1,116 known drug–disease pairs already have a drug→target→disease path, against 1.7% of 100,000 random drug–disease pairs. Counting shared targets alone separates known from random pairs at AUC 0.848, with no model. That is measured on training pairs, not their test set; their GNNs report test AUC 0.84–0.91. Compare any GNN against this rule before quoting AUC.
- The shipped `processed_data/` does not match the paper: 1,116 vs 996 drug–disease edges, 103,921 vs 72,977 disease–gene edges, 1,211 vs 726 genes.
- At a realistic 1:100 positive:negative ratio the paper's best F1 is 0.28 (TransformerConv). Quote imbalanced metrics, not the balanced 1:1 AUC.
