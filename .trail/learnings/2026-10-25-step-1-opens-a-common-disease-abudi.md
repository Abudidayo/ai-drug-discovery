---
title: Step 1 opens a common disease and reuses saved Experiments; Back and Next live in the footer
author: Abudi
date: 2026-10-25
cost: { minutes: 14, tokens: 185706 }
id: l-8dcb1c7f
scope: repo
status: active
src: agent
touches:
  - api/openapi.json
  - api/oxhack_api/routes/api.py
  - api/oxhack_api/schemas.py
  - api/oxhack_api/services/experiments.py
  - api/oxhack_api/services/live.py
  - api/oxhack_api/services/source.py
  - api/tests/test_live.py
  - api/tests/test_misc.py
  - web/e2e/evaluation.spec.ts
  - web/e2e/steps-1-4.spec.ts
---

## Decided
- The user asked for step 1 to preload common diseases for show, and for choosing a disease to update the graph in place rather than jump ahead. `GET /api/diseases/common` comes from the source: `FixtureSource` lists its saved Diseases, `LiveSource` uses `COMMON_DISEASES` in api/oxhack_api/services/live.py (seven Diseases each built live on 25 Oct with 15 network-placed Candidates, COVID-19 first because baricitinib is its known-answer check).
- `useOpenDisease` (web/src/api/queries.ts) reuses the newest active Experiment for the Disease that hasn't failed (`include_building=true`) before building a new one, so the landing page and the common list show a network at once and never build the same Disease twice.
- The landing page opens the first common Disease with `replace`. The preload lives in `DiseaseSearch` (`preload`), so its errors, retry and busy marker are the same UI as a manual choice.
- The user moved Back/Next to the footer (bottom right) and dropped the "How well the ranking works" link as not needed. The /evaluation page stays reachable by URL for the plan's M6 evidence.

## Watch out
- `DiseaseSearch` is keyed by Experiment ID, so it remounts when the Experiment loads. In tests, wait for the pre-filled name before typing (`loadedSearchbox` in web/src/app/experiment.test.tsx).
