---
title: "Follow-ups start when the reader leaves step 1; a first build's time is serial ChEMBL/PubChem latency"
author: Abudi
date: 2026-10-25
cost: { minutes: 23, tokens: 146380 }
id: l-7c9ccda1
scope: repo
status: active
replaces: l-47062170
src: agent
touches:
  - api/openapi.json
  - api/oxhack_api/app.py
  - api/oxhack_api/jobs.py
  - api/oxhack_api/routes/api.py
  - api/oxhack_api/services/experiments.py
  - api/oxhack_api/settings.py
  - api/tests/conftest.py
  - api/tests/test_follow_ups.py
  - api/tests/test_misc.py
  - scripts/serve.sh
---

## Decided
- The user wanted the steps after picking a Disease to wait less, but starting the jury and poses as soon as a build finished made step 1 lag. Each Disease a reader merely tried set Vina going, and Vina uses every CPU, so the API answered slowly while they clicked. The user asked for the work to start after Next instead. Now web/src/app/routes/ExperimentLayout.tsx calls POST /api/experiments/{id}/follow-ups (`ExperimentService.start_follow_ups`) once per Experiment, when the reader is on any step after the first and the Experiment is ready. Asking again starts nothing new. scripts/serve.sh runs the docking worker with `nice -n 10`.
- `services/docking.py` `structure_for` mirrors web/src/lib/docking.ts `structureFor`. Keep the two the same, or background poses land in a structure the pose step doesn't open.
- `EvidenceSources.prefetch` (api/oxhack_api/stream_a.py) warms the response cache six requests at a time, through stream A's own calls, on a separate sources copy. From empty caches, COVID-19 went from 33.2 s to 16.3 s with an identical evidence packet.

## Tried and ruled out
- Starting the follow-ups from the build job itself (`after_build`): it lagged step 1, as above.
- Running stream A's evidence packet per drug in threads: stream A's DuckDB connection isn't thread-safe (hence `LiveSource._lock`). Only the HTTP fetches are parallel.
- Warming the cache through the build's own sources object: `pubchem_cid` records rejections, and from threads their order (saved with the packet) would vary.

## Watch out
- About half a cold first build is single ChEMBL requests, each taking 0.3 to 7.7 s. The first build after an API restart also waits for the network bundle to load.
- The follow-ups run the paid Cortex jury for each Experiment a reader goes past step 1 on.
