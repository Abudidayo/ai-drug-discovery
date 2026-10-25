---
title: "Builds start their jury and poses themselves; a first build's time is serial ChEMBL/PubChem latency"
author: Abudi
date: 2026-10-25
cost: { minutes: 22, tokens: 178537 }
id: l-47062170
scope: repo
status: active
src: agent
touches:
  - api/oxhack_api/services/live.py
  - api/oxhack_api/stream_a.py
  - api/tests/test_live.py
  - api/oxhack_api/app.py
  - api/oxhack_api/jobs.py
  - api/oxhack_api/services/docking.py
  - api/oxhack_api/services/experiments.py
  - api/oxhack_api/settings.py
  - api/tests/conftest.py
  - api/tests/test_follow_ups.py
---

## Decided
- The user wanted the steps after picking a Disease to wait less. Once a build is ready, `jobs.build_experiment` calls `JobFactory.after_build`, which `app.build_components` wires to `ExperimentService.start_follow_ups`: ask the jury and queue a pose for every dockable drug, the known-answer drug first. `OXHACK_FOLLOW_UPS=0` turns this off; api/tests/conftest.py does, so only test_follow_ups.py sees it.
- `services/docking.py` `structure_for` mirrors web/src/lib/docking.ts `structureFor`. Keep the two the same, or background poses land in a structure the pose step doesn't open.
- `EvidenceSources.prefetch` (api/oxhack_api/stream_a.py) warms the response cache six requests at a time, through stream A's own calls, on a separate sources copy. From empty caches, COVID-19 went from 33.2 s to 16.3 s with an identical evidence packet.

## Tried and ruled out
- Running stream A's evidence packet per drug in threads: stream A's DuckDB shared connection isn't thread-safe (hence `LiveSource._lock`). Only the HTTP fetches are parallel.
- Warming through the build's own sources object: `pubchem_cid` records rejections, and from threads their order (saved with the packet) would vary.

## Watch out
- Measured cold (packets/http emptied): about half a first build is single ChEMBL requests, each taking 0.3 to 7.7 s. The first build after an API restart also waits for the network bundle to load.
- Follow-ups run the paid Cortex jury for every Experiment that gets built, including the common-disease preloads (once each, as saved Experiments are reused).
