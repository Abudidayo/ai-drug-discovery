---
title: Vina docks the SMILES saved with the job; live SMILES come from ChEMBL parents
author: Abudi
date: 2026-10-25
branch: abdullah-nextverse/workstream-c
cost: { minutes: 78, tokens: 576099 }
id: l-aa2937f4
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
- The docking worker reads `Repo.dock_inputs(job_id)` (cache key and SMILES stored when the request was queued) instead of looking the SMILES up again, so a queued job can't change ligand.
- Live Candidates outside `fixtures/docking.json` are docked as ChEMBL's parent canonical SMILES (`services/ligands.py`, cached in `data/ligands/`, "not a small molecule" cached too). Before this only 5 of COVID-19's 15 live Candidates were dockable; after it 10.

## Watch out
- On Apple Silicon the worker runs in the amd64 `oxhack-docking:local` container (see worker/README.md); the API runs natively against the same local Postgres. Measured live: 6WTO 2.43 Å and 6WTN 2.83 Å redock controls fail, 6O0K 1.08 Å and 7BQU 0.41 Å pass, same as the agent's run.
