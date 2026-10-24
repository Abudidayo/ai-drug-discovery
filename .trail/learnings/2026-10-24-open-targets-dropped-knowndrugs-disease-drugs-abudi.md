---
title: Open Targets dropped knownDrugs; disease drugs now come from drugAndClinicalCandidates
author: Abudi
date: 2026-10-24
branch: main
cost: { minutes: 13, tokens: 330236 }
id: l-8a55cdfd
scope: repo
status: active
src: agent
touches:
  - demos/data-sources/README.md
  - demos/data-sources/index.html
  - demos/data-sources/server.mjs
  - docs/lab-drug-testing-frequency.md
  - docs/mvp-spec.md
---

## Decided
- demos/data-sources/server.mjs reads a disease's drugs from `disease.drugAndClinicalCandidates { count rows { maxClinicalStage drug { id name drugType } } }` (Open Targets API 26.9.0, data 26.09). The field takes no pagination arguments and returns every row (540 for COVID-19 MONDO_0100096), so the server sorts by stage and slices.
- PubChem is looked up by the ChEMBL standard InChIKey, not by drug name, so the structure always matches the ChEMBL record. Antibodies and other biologics have no InChIKey and skip PubChem.
- Open Targets, ChEMBL and PubChem need no API keys and all allow browser CORS (Open Targets even echoes Origin: null for file://).

## Tried and ruled out
- The old `knownDrugs` field and most tutorials that use it no longer work against the current Open Targets schema.

## Watch out
- Stage data lags regulators: Open Targets `maxClinicalStage` and ChEMBL drug_indication both list baricitinib for COVID-19 at phase 3, although the FDA approved it for some hospitalised COVID-19 patients in 2022. Never derive "approved for this disease" from either field alone.
- Stage values seen: APPROVAL, PHASE_3, PHASE_2_3, PHASE_2, PHASE_1_2, PHASE_1, EARLY_PHASE_1, UNKNOWN.
- ChEMBL has no warnings for many drugs; show safety as unknown, never safe (docs/mvp-spec.md).
