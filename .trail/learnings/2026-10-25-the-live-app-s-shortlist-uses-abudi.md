---
title: "The live app's shortlist uses stream B's physical RWR; z-score stays as closeness and for the fixture"
author: Abudi
date: 2026-10-25
branch: abdullah-nextverse/workstream-c-rwr
cost: { minutes: 12, tokens: 216063 }
id: l-50416ddd
scope: repo
status: active
src: agent
touches:
  - ranking/SHORTLIST_HANDOFF.md
  - ranking/tests/test_application_shortlist.py
  - workstream_b/application_shortlist.py
  - worker/README.md
  - api/oxhack_api/app.py
  - api/oxhack_api/repo/base.py
  - api/oxhack_api/repo/memory.py
  - api/oxhack_api/repo/postgres.py
  - api/oxhack_api/services/docking.py
  - api/oxhack_api/services/ligands.py
---

## Decided
- Live Experiments fill the 10 network places from Zaid's physical random walk with restart (`workstream_b/application_shortlist.py` DEFAULT_METHOD `physical_rwr`), through stream B's own `ranking.shortlist.project_shortlist`. `api/oxhack_api/stream_b.py` `Engine.rank` runs both `RankingEngine` (z-score) and `RWREngine` on the same physical bundle and merges them with `enrich_ranking`; `select()` picks the shortlist.
- Each placed Candidate keeps its closeness (`network.rank`, `degree_matched_z`) and adds `network.rwr {rank, mass}`; `ranking_settings.shortlist_method` says which one picked the shortlist. The UI shows the walk rank as "Network rank" with a numbered note, and keeps the closeness column.
- The COVID-19 fixture stays a z-score Experiment (`shortlist_method: zscore`, `rwr: null`), because its jury.json was recorded against that shortlist. Migration 0007 marks older saved rows the same way.
- `NetworkRanking(shortlist_method="zscore")` brings back the original shortlist.

## Watch out
- After `rerank` drops ineligible drugs, the walk ranks are renumbered as well (higher mass first, then ChEMBL ID), matching `RWREngine.rank`. The masses themselves don't change.
- A drug the walk reaches always has a closeness result, and the other way round (same retained drug Targets in the same largest component). `_ranked` raises an error if that ever stops being true.
- Network paths are shortest-path explanations, not random-walk explanations (stream B's note). They're still drawn for walk-selected drugs.
