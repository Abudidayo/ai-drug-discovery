---
title: "STRING 12.5 maps 97.5% of human proteins to Ensembl genes through Open Targets; Disease IDs can contain letters"
author: Jessica
date: 2026-10-24
branch: Jessica-mak/stream-a
cost: { minutes: 4, tokens: 20693 }
id: l-52117acb
scope: repo
status: active
touches:
  - pipeline/string_map.py
  - tests/pipeline/data/string_map/9606.protein.info.v12.5.txt.gz
  - tests/pipeline/data/string_map/README.md
  - tests/pipeline/data/string_map/target.parquet
  - tests/pipeline/data/string_map/version.json
  - tests/pipeline/test_string_map.py
  - plan.md
---

## Decided
- pipeline/string_map.py maps STRING 12.5 to Ensembl genes only through Open Targets 26.09 `target.proteinIds` (`ensembl_PRO`). Result: 19,212 of 19,699 human proteins map, 487 don't, none are ambiguous, and 12 genes have several STRING proteins (their edges merge into one node).
- Biologics stay in the approved-drug universe (Jessica's call). They get Targets from mechanisms only; ChEMBL bioactivity is added for small molecules only.

## Watch out
- plan.md §3 gives the Disease ID pattern `^[A-Za-z]+_[0-9]+$`, but real Open Targets IDs such as `NCIT_C74532` have letters after the underscore. Validate with `^[A-Za-z]+_[A-Za-z0-9]+$` and let the catalogue decide whether an ID exists.
- Open Targets mechanism rows can carry an ENSG even when the target is nucleic acid (risdiplam → SMN2 pre-mRNA). Check the mechanism's target type before treating it as a protein Target.
