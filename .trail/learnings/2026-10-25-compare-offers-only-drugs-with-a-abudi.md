---
title: Compare offers only drugs with a 3D model
author: Abudi
date: 2026-10-25
cost: { minutes: 17, tokens: 58977 }
id: l-ab104e71
scope: repo
status: active
src: agent
touches:
  - web/src/steps/CompareStep.tsx
  - web/src/lib/candidates.ts
  - api/oxhack_api/services/molecules.py
---

Compare (step 6) now leaves out drugs with no 3D model entirely. It asks /api/molecules/{cid}/conformer for every drug on the shortlist (useQueries in CompareStep useModels) and shows nothing until all have answered, so no option appears and then vanishes. 404 means no model (antibodies have no pubchem_cid and are never asked). Before this change the PubChem source returned None, i.e. 404, on network errors and on PubChem 5xx too, which would have hidden drugs as modelless whenever PubChem hiccuped. Now those raise MoleculesUnavailable and the route answers 503; the web keeps such drugs on offer and says 'The 3D model couldn't be loaded.' in their column. Asking for a whole shortlist at once (about 15 parallel requests) tripped PubChem's 5-requests-a-second limit in live mode: PubChem answered HTTP 503 'server busy' for 4 of 15 compounds. PubChemMolecules therefore spaces requests 0.25 s apart across threads and asks again up to twice after 1 s and 2 s on a 503.
