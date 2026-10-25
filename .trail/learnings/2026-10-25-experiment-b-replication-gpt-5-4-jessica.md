---
title: "Experiment B replication: GPT-5.4 and Opus beat chance blind, the 3-model jury does not because Opus refusals leave juries incomplete"
author: Jessica
date: 2026-10-25
branch: Jessica-mak/stream-a
cost: { minutes: 9, tokens: 15064 }
id: l-6dbb0339
scope: repo
status: active
touches:
  - jury/pilot.py
  - pipeline/panels.py
  - results/experiment_b_replication/audit_sample.json
  - results/experiment_b_replication/candidates.json
  - results/experiment_b_replication/preregistered.json
  - results/experiment_b_replication/protocol.md
  - results/experiment_b_replication/protocol_frozen.json
  - results/experiment_b_replication/results.json
  - results/experiment_b_replication/results.md
  - results/experiment_b_replication/validation_failures.json
---

## Decided
- results/experiment_b_replication/ ran 14 new Diseases (pre-registered; identical pipeline). Primary MRR (chance 0.221): jury 0.210 (not above chance), GPT-5.4 0.461 (Holm p 0.013), Opus 0.422 (Holm p 0.049), Kimi 0.374 (p 0.19), direct evidence 0.111, network z 0.182. Pooled 25 panels: GPT 0.445 and Opus 0.421 significant; jury 0.310 not.

## Watch out
- The jury loses because a panel's jury only counts when all three jurors are valid. Opus returned the provider's `refusal` stop reason with incomplete JSON on 11 attempts, leaving 5 of 14 panels without an Opus ballot, so the jury scored a miss there. This is a reliability problem, not judgment. Fix Opus refusals, or pre-register a rule that aggregates the valid jurors, before any further test.
- Single-model blind results are the strongest evidence that the evidence packet carries real signal. Simple baselines (direct evidence, network z) don't beat chance on these panels.
