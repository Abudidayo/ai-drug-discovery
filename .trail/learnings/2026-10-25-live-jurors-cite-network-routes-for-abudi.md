---
title: "Live jurors cite network routes for every drug acting on the route's start protein"
author: Abudi
date: 2026-10-25
branch: abdullah-nextverse/workstream-c
cost: { minutes: 78, tokens: 576099 }
id: l-089ff60b
scope: repo
status: active
src: agent
touches:
  - api/oxhack_api/app.py
  - api/oxhack_api/repo/base.py
  - api/oxhack_api/repo/memory.py
  - api/oxhack_api/repo/postgres.py
  - api/oxhack_api/services/docking.py
  - api/oxhack_api/services/ligands.py
  - api/tests/test_ligands.py
  - worker/tests/test_queue.py
  - api/oxhack_api/stream_a.py
  - api/tests/test_live.py
---

## Decided
- `api/oxhack_api/stream_a.py` `share_routes` lists each `network_path` item under every shortlisted Candidate whose own Target starts the route, after stream A's `add_network_paths` (which allows at most three representative routes per Candidate). No evidence item is added, only who it is listed under.

## Tried and ruled out
- Passing every route as a representative path: stream A refuses more than three per Candidate.

## Watch out
- Without this, real Cortex jurors (GPT-5.4, Kimi K3) cited "JAK1 – TYK2" for every JAK1 drug and stream A's checker rejected the whole review as "evidence belongs to another Candidate"; with jury-v7 that left fewer than two valid jurors and no consensus.
- Stream A's number check also flags digits inside multi-word protein names from mechanism statements ("Interleukin-1 receptor-associated kinase 1"): a checker false positive, left to stream A.
- The live jury takes 5 to 15 minutes: run_jury reports only at the end, each Cortex call may take up to SNOWFLAKE_TIMEOUT_SECONDS (300 s), and Kimi K3 can time out.
