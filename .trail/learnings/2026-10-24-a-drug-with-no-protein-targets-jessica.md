---
title: "A drug with no protein Targets can't be shortlisted; jury evidence values are numbers only"
author: Jessica
date: 2026-10-24
branch: Jessica-mak/stream-a
cost: { minutes: 25, tokens: 464911 }
id: l-e5e143f0
scope: repo
status: active
touches:
  - fixtures/README.md
  - fixtures/candidates.json
  - fixtures/disease_targets.json
  - fixtures/drug_targets.json
  - fixtures/evidence_packet.json
  - fixtures/jury_result.json
  - fixtures/string_id_map.json
  - jury/__init__.py
  - pipeline/__init__.py
  - pyproject.toml
---

## Decided
- fixtures/ is the Stream A contract (A0). In evidence items, `values` holds only numbers, so the jury validator can check every number a juror quotes. Names, sources and classes go in `statement`.
- One source record gets one E ID per Experiment, shared by every Candidate it concerns (for example, JAK1's association is cited by both baricitinib and ruxolitinib). Otherwise jurors see uneven evidence for Candidates with the same Targets.
- Warnings keep `toxicity_class` and `description` as separate fields. Open Targets black-box records often have no description, so `description` is null then.

## Tried and ruled out
- Melphalan (acts on DNA) as the `not_scorable` Candidate example. A drug with no protein Targets has no direct-evidence rank, so neither shortlist rule can pick it. It stays only in drug_targets.json, as the `non_protein_target` example. The not_scorable example is now venetoclax → BCL2, a Target with no network path to any Disease Target.

## Watch out
- `trail check` flags fixtures/ against the `knownDrugs` learning because the wording looks similar. Nothing in fixtures/ uses `knownDrugs`.
