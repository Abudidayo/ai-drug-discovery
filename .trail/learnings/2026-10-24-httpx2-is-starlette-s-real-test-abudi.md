---
title: "httpx2 is Starlette's real test-client dependency; COVID fixture drug picks need regulator approval"
author: Abudi
date: 2026-10-24
branch: abdullah-nextverse/workstream-c
cost: { minutes: 6, tokens: 76191 }
id: l-7b00e307
scope: repo
status: active
src: agent
touches:
  - api/openapi.json
  - api/oxhack_api/app.py
  - api/oxhack_api/deps.py
  - api/oxhack_api/fixtures/conformers/11671467.json
  - api/oxhack_api/fixtures/conformers/121304016.json
  - api/oxhack_api/fixtures/conformers/16722836.json
  - api/oxhack_api/fixtures/conformers/25126798.json
  - api/oxhack_api/fixtures/conformers/44205240.json
  - api/oxhack_api/fixtures/conformers/5291.json
  - api/oxhack_api/fixtures/conformers/5426.json
---

## Decided
- `api/` depends on `httpx2`, not `httpx`, for FastAPI's TestClient. Starlette 1.2+ imports `httpx2` first and warns that plain `httpx` is deprecated. The package lives at github.com/pydantic/httpx2, so it is not a typosquat.
- The COVID-19 fixture (`api/oxhack_api/fixtures/MONDO_0100096/experiment.json`) dropped camostat, nafamostat and fluvoxamine. Open Targets 26.09 has no regulator-backed approval for them, so plan 4.2 excludes them from the Candidate universe even though the prototype showed them.
- Antibodies (tocilizumab, sarilumab, siltuximab, anifrolumab) have `pubchem_cid: null`. `GET /api/molecules/{cid}/conformer` answers 404 for them, so the UI needs an explicit "no small-molecule 3D model" state.

## Watch out
- The prototype's nafamostat ChEMBL ID was a salt form, not the parent. Verify parent IDs in ChEMBL before using an ID from older notes.
- ChEMBL names arrive in upper case (BARICITINIB). Format names in the UI rather than changing the data.
- Open Targets lists baricitinib for COVID-19 at phase 3 even though FDA approved it, because stage data lags the regulators. The known-answer flag is set in the fixture, not derived from the stage.
