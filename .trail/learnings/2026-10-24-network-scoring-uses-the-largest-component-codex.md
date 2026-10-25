---
title: Network scoring uses the largest component and explicit distance-only results
author: Codex
date: 2026-10-24
branch: main
id: l-dda059ed
scope: repo
status: active
replaces: l-4b12c4d6
src: agent
touches:
  - plan.md
  - docs/build-reference.md
  - demos/data-sources/README.md
---

## Decided
- `plan.md` sections 4.1 and 4.3 now restrict network scoring to the largest connected component; excluded proteins remain in coverage counts. Distance value 255 is unreachable and must never enter an average.
- A Candidate with no retained Targets is `not_scorable`, with `network = null`. A valid raw distance with zero null variance is instead `distance_only`: preserve `mean_distance`, use a null z-score and `network.warning = "zero_null_variance"`, and rank it after valid z-scores. Section 9.2 defines the payload so the product need not invent a score.
- The null randomises both Target sets with size and degree matching, using degree bins of at least 100 proteins. Ordering is ascending z-score, raw distance and ChEMBL ID; distance-only Candidates use raw distance and ID. Measure ties and zero-variance frequency on the pilot.
- Commit 63b4f27 resolved the earlier UniProt/Ensembl mapping and Experiment-wide evidence-ID conflicts in `docs/build-reference.md`, and marked the research notes as superseded by the plan. Those warnings in the replaced learning are no longer current.
## Watch out
- `demos/data-sources/README.md` still says no retries, while `server.mjs` has transient-failure retries. This remains a separate minor documentation mismatch.
