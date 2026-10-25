---
title: "Pre-registered blind Experiment B: jury MRR 0.44 vs chance 0.22, not significant after correction"
author: Jessica
date: 2026-10-25
branch: Jessica-mak/stream-a
cost: { minutes: 30, tokens: 67441 }
id: l-47b9d8fe
scope: repo
status: active
touches:
  - fixtures/README.md
  - fixtures/candidates.json
  - fixtures/evidence_packet.json
  - jury/client.py
  - jury/pilot.py
  - pipeline/packets.py
  - pipeline/panels.py
  - pipeline/pathways.py
  - results/experiment_b/audit_sample.json
  - results/experiment_b/metrics_verification.json
---

## Decided
- results/experiment_b/ holds the frozen protocol (amended before any live call; sha256 133ccad5…) and the results. It ran 11 of Zaid's cohort Diseases (his 16 minus RA, T2D, Parkinson, COPD and hypertension, which were used for jury selection). Each Disease got one blind 15-Candidate panel with mechanism, association, bioactivity, network-path and Reactome pathway evidence.
- Results (MRR, with chance at 0.221): jury 0.439, Opus 0.420, GPT-5.4 0.425, Kimi 0.371, direct evidence 0.343, network z-score 0.265. No method passed the pre-registered multiple-comparison-corrected test (jury adjusted p = 0.075). Reactome pathway evidence showed no benefit in the paired comparison.

## Watch out
- With 11 panels the test is underpowered. The jury trend is promising, not established. Don't present it as significant.
- Panel rule amendments (decided before any call): use every available plausible decoy (hypercholesterolemia had only 1), and drop any Candidate whose name equals a Target symbol, such as becaplermin and PDGFB, because it can't be blinded.
