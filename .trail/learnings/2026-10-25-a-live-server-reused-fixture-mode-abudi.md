---
title: "A live server reused fixture mode's made-up baricitinib pose from the shared database, so its 3D model 404ed"
author: Abudi
date: 2026-10-25
cost: { minutes: 7, tokens: 85557 }
id: l-ed77c245
scope: repo
status: active
src: agent
touches:
  - jury/client.py
  - tests/jury/test_client.py
  - docs/design.md
  - web/README.md
  - web/e2e/steps-1-4.spec.ts
  - web/e2e/steps-5-8.spec.ts
  - web/src/app/PageFrame.module.css
  - web/src/app/PageFrame.tsx
  - web/src/app/Shell.test.tsx
  - web/src/app/experiment.test.tsx
---

## Decided
- The cause of "The 3D model couldn't be loaded" for baricitinib in 6WTO on the demo codespace (25 Oct): the shared Tiger database still held fixture mode's precomputed job 6f1d2c1e-0a4b-4c55-9d0e-5b7a3c9e0001 (fixture = true, made-up scores). Its cache key equals the real one, because docking.json's SMILES and settings are real, so the live Vina server's request followed it (cached_from). Its files exist only in api/oxhack_api/fixtures/docking_files/, and VinaDocking serves files only from $RESULTS_DIR, so /api/files returned 404.
- Fix: `find_reusable_dock_job(cache_key, fixture)` in api/oxhack_api/repo/{base,memory,postgres}.py only reuses a job of the same kind, and migration 0008 makes the one-live-computation unique index per (cache_key, fixture). Regression test: test_a_live_server_never_reuses_a_made_up_result in api/tests/test_docking.py.

## Tried and ruled out
- Marking fixture cache keys differently instead: no migration, but the row already saved in Tiger keeps its old key, so it still needs a data fix, and the frozen-key test in worker/tests/test_cache_key.py ties the key to the worker.

## Watch out
- Jobs that already followed a made-up result (88b2bab6-e7d5-49f7-9f29-072a6475919c in experiment 76780bb0) stay broken. Request the pose again in a new experiment, or fail that row.
- On the codespace, DATABASE_URL comes from the codespace secrets, not .env. An ssh shell doesn't have it; read it from the API process's environment.
