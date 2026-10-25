---
title: RWR and functional STRING comparison preserves legacy scores and excludes jury-development cases
author: Zaid
date: 2026-10-25
scope: repo
status: active
touches:
  - ranking/rwr.py
  - ranking/functional_graph.py
  - ranking/rwr_evaluation.py
  - ranking/rwr_protocol.json
  - ranking/RWR_RESULTS.md
---

## Decided

- Add RWR independently of the unchanged proximity/z-score algorithms. Sparse float64 row normalization with dangling self-loops; iterate `p_next = 0.7 * P.T @ p + 0.3 * p0`, uniform on retained top-50 Disease Targets, L1 tolerance 1e-12, limit 1000. Score mean mass at retained drug Targets, descending then ChEMBL ID. Scope is each graph's LCC; failed convergence yields no scores.
- Keep original physical graph artifacts. The initially missing functional input was downloaded from the official human STRING 12.5 basic links URL; actual columns are protein1/protein2/combined_score. Separate `data/ranking/string-12.5-functional-c700-v1/` contains a functional-association CSR graph at confidence >=700 with no experiment-channel condition or distance matrix. It has 19,199 nodes, 273,593 edges, 2,144 components and a 16,963-node LCC; build 23.641s. All 113,969 original physical edges are present.
- The sealed experiment `data/evaluation/rwr-functional-ot26.09-v1/` excludes RA, type 2 diabetes, Parkinson disease, COPD and hypertension by canonical IDs. The remaining 11 Diseases have 276 source-reference pairs. Frozen configuration/hash precedes evaluation; SHA256 `495886d136830d44a093eb6919266724ed6d9d295b131e456950f18b8cff5bc5`.
- The new evaluator parameterizes method names and reuses Stage 3's metrics/bootstrap functions. Five methods use the same eligible 1,956 Candidates; full unretrieved and common-available scopes are separate. All ten paired comparisons have per-Disease differences and 1000-draw seed-0 intervals.
- Candidate `rwr.physical` and `rwr.functional` are optional additive fields. Original status/coverage still refer to proximity; each RWR child has its own status, coverage and rank. Original `network_paths` are preserved and explain shortest-path proximity only; RWR explicitly sets `shortest_paths_explain_this_score=false` and separately supplies top mass contributors.

## Watch out

- All 93 tests pass. The real run took 16.696s; all 22 distributions converged (54-57 functional, 59-61 physical iterations). Independent equations checked all distributions and 43,032 score records, with maximum fixed-point residual 6.546e-13. All 66 original per-Disease baseline metric rows, paths and old frozen outputs are unchanged. First-case replays on both graphs reproduced scores/distributions exactly.
- Functional Candidate coverage rises from 1307/1956 (66.82%) to 1383/1956 (70.71%), rescuing 76 without losses; reference coverage 234/276 -> 249/276. The five-method common subset remains 1307. Functional RWR also changes retained Disease seed coverage, so this is not a topology-only intervention.
- Full Recall@20 / MRR: direct .216700/.499417, raw .219736/.513676, z .145216/.275970, physical RWR .210979/.596212, functional RWR .229477/.459374. Key paired intervals against direct evidence and between the graphs include zero; do not claim consistent superiority from the coverage increase.
- These 11 Diseases were already used in the earlier 16-case benchmark. They are jury-development-excluded, not an unseen/prospective clinical holdout. Frozen metadata labels retain source-quality and indirect-leakage limitations; RWR mass is not treatment-success probability. Mass magnitudes are graph-dependent and are not cross-graph calibration.
- Source functional gzip: 62,813,591 bytes, SHA256 `3d6894ef3a0a8578b70421b7d6bac159c41ed2f6c1b5da21ab7fabb4ac21cd25`; exact source/download metadata stays beside it in ignored data/string.
