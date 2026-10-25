---
title: Disease search lists only real diseases with 3+ drugs tested in phase 2 or later
author: Abudi
date: 2026-10-25
cost: { minutes: 5, tokens: 52928 }
id: l-58eda89a
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
- api/oxhack_api/services/live.py `DiseaseCatalogue` searches only investigable Diseases: at least one Open Targets therapeutic area outside measurement, phenotype, biological process, non-human animal disease and medical procedure (`NOT_DISEASE_AREAS`), and at least `MIN_TESTED_DRUGS` = 3 distinct drugs at PHASE_2 or later in ot/clinical_indication. In 26.09 that is 1,757 of 45,896 entries, all 7 `COMMON_DISEASES` included. `resolve()` still accepts any ID, so saved Experiments keep working.
- Why: the user found search offering edge cases ("asthma symptoms measurement", "diabetes mellitus, permanent neonatal 4", "heart rate") that build thin or meaningless shortlists. Of the 45,896 entries, 17,825 are OBA measurements, 2,183 are HP phenotypes and 470 are GO processes.

## Tried and ruled out
- Excluding an entry when any of its therapeutic areas is a non-disease one: that dropped asthma, diabetes mellitus, Alzheimer disease, systemic lupus erythematosus and rheumatoid arthritis, because Open Targets also files them under phenotype. The rule is "has a disease area", not "has no non-disease area".
- At least 1 approved drug: drops COVID-19-adjacent and newer diseases, and Open Targets stage data lags regulators.

## Watch out
- Fixture mode's search (services/source.py) is unchanged; it only lists the saved fixture Diseases.
