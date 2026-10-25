---
title: "uv --env-file strips JSON quotes, and phone CSS needs the specificity of the rule it overrides"
author: Abudi
date: 2026-10-25
branch: abdullah-nextverse/workstream-c
cost: { minutes: 86, tokens: 436975 }
id: l-90443f0f
scope: repo
status: active
src: agent
touches:
  - ".env.example"
  - api/oxhack_api/settings.py
  - api/tests/test_live.py
  - web/src/app/Figure.module.css
  - web/src/charts/DotPlot.module.css
  - web/src/charts/DotPlot.tsx
  - api/oxhack_api/app.py
  - api/oxhack_api/services/molecules.py
  - api/scripts/fetch_conformers.py
  - api/tests/test_molecules.py
---

## Watch out
- `uv run --env-file .env` drops the double quotes inside an unquoted value, so `SNOWFLAKE_MODELS=["a","b","c"]` arrives as `[a,b,c]` and stopped the API at startup ("error parsing value for field models"). Wrap JSON values in single quotes in `.env`: `SNOWFLAKE_MODELS='["a","b","c"]'`. `api/oxhack_api/settings.py` now parses these values itself (pydantic-settings `NoDecode`) and names the variable and this fix when one is malformed.
- `web/src/app/Figure.module.css`: a mode rule such as `.grid[data-network="none"][data-layout="evidence"]` (3 attributes) beats the phone rule `.grid[data-layout]` (2), so phones silently kept two columns and squeezed live Evidence to about 100px wide. Compare had the same bug. Inside the `max-width: 720px` block, repeat any column change at the same specificity as the rule it overrides. jsdom can't check media queries; measure at 390px in a real browser.
- Live mode used to read molecule shapes only from the COVID fixture, so every live drug showed "No 3D model". `PubChemMolecules` (`api/oxhack_api/services/molecules.py`) fetches PubChem 3D conformers on demand into `data/conformers/`. A 404 is cached as `<cid>.none`; network failures are not cached. A missing PubChem ID does not mean an antibody (live peficitinib has none).
