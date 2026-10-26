# Network-path explanations

Implemented as additive enrichment in [paths.py](../../core/ranking/paths.py). The scorer, null
model, shortlist selection and evaluator are unchanged. Existing Stage 1–3 and
benchmark outputs remain untouched. All **80 tests pass** (68 existing plus 12
path tests).

## Run

```powershell
.\.venv-ranking\Scripts\python.exe -m ranking.paths --artifacts data/ranking/string-12.5-c700-e400 --input data/ranking/stage3-api/MONDO_0009693.json --output data/ranking/network-paths-v1/MONDO_0009693
.\.venv-ranking\Scripts\python.exe -m ranking.paths --artifacts data/ranking/string-12.5-c700-e400 --input data/ranking/stage3-api/MONDO_0100096.json --output data/ranking/network-paths-v1/MONDO_0100096
```

Use a new output directory to repeat a run. Inputs may be full Stage 2 ranking
JSON or its Stage 3 API-adapted form. The real examples above use the adapted
form, preserving its shared Candidate fields. Existing output directories and
already-enriched inputs are rejected rather than overwritten. No additional
dependencies or network access are needed.

For reuse in Python, `PathReconstructor(artifacts, disease_target_ids)` exposes
`nearest_path(drug_target_id)` and `validate_path(record)`.
`explain_ranking(payload, artifacts)` returns an enriched copy and the complete
path document; `explain_files(...)` writes and hashes the complete bundle.

## Reconstruction and validation

Vertices are the real Ensembl gene Target IDs retained by Stage 1's gene-level
STRING network. A path is ordered from drug Target to Disease Target. Its order
does not imply signaling direction in this undirected graph.

For each retained drug Target, choose the minimum saved distance to a retained
Disease Target. Break endpoint ties by Disease Target Ensembl ID. Starting at
the drug Target, repeatedly choose the lexicographically smallest neighboring
Ensembl ID whose saved distance to that endpoint decreases by one. This yields
one deterministic shortest path per contributing Target. An overlap is a
one-vertex, zero-hop path.

The implementation uses separate full-graph and distance-matrix indexes. It
casts encoded distances to Python integers before arithmetic; 255 is an
unreachable sentinel and is never a distance or an averaging contribution.
Missing, invalid, disconnected and unreachable Targets receive explicit
unavailable reasons in the reusable low-level API. The ranking enricher rejects
stale retained-Target claims, mismatched artifact hashes or inconsistent means.

Every emitted path is checked for its endpoints, real IDs, consecutive saved
graph edges, length and agreement with the nearest saved matrix distance. The
mean of **all** contributing path hop counts must reproduce the saved Candidate
`network.mean_distance` within numerical tolerance. No z-score is recalculated.
The paths explain the observed-distance component; the existing conditional
null distribution remains part of the z-score calculation.

The saved CSR graph has binary edges and retains no individual edge evidence
records. Every explanation therefore states
`derived_from_pinned_filtered_STRING_graph`, with `edge_level_citations` set to
`not_retained`. The shared graph provenance includes STRING **12.5**, minimum
combined score **700**, minimum direct experiments **400**, and the graph,
identifier-index and distance-file hashes. It invents no edge citations.
All explanations explicitly describe **network associations, not proven
biological mechanisms, causal routes or treatment evidence**.

## Backward-compatible Candidate extension

Original fields and the full ranking's `format_version` are preserved. Only
shortlisted Candidates gain the optional `network_paths` field. A new top-level
`network_paths_provenance` records policies and source hashes. Dropping these
additions recovers the original input exactly. The existing API validator and
adapter accept and preserve this field; Stage 3 reconstructs the identical
evaluation case from the enriched ranking.

The following is the complete new field for COVID-19 baricitinib, together with
its join key. Existing Candidate fields accompany it in the actual output:

```json
{
  "candidate_id": "CHEMBL2105759",
  "network_paths": {
    "schema_version": 1,
    "status": "available",
    "reason": null,
    "graph_version": "string-12.5",
    "retained_drug_target_count": 6,
    "score_contributing_target_count": 6,
    "disease_target_count": 41,
    "complete_path_count": 6,
    "representative_policy": "sort all verified paths by (hops, drug_target_id, disease_target_id, target_ids); include all if <=3, otherwise first, lower median and last",
    "interpretation": "Network associations in an undirected gene-level graph, not proven biological mechanisms, causal routes or treatment evidence.",
    "provenance": "derived_from_pinned_filtered_STRING_graph",
    "edge_level_citations": "not_retained",
    "paths": [
      {
        "drug_target_id": "ENSG00000105397",
        "disease_target_id": "ENSG00000105397",
        "target_ids": ["ENSG00000105397"],
        "hops": 0, "graph_version": "string-12.5",
        "status": "available", "reason": null
      },
      {
        "drug_target_id": "ENSG00000162434",
        "disease_target_id": "ENSG00000105397",
        "target_ids": ["ENSG00000162434", "ENSG00000105397"],
        "hops": 1, "graph_version": "string-12.5",
        "status": "available", "reason": null
      },
      {
        "drug_target_id": "ENSG00000115977",
        "disease_target_id": "ENSG00000105397",
        "target_ids": ["ENSG00000115977", "ENSG00000161203", "ENSG00000142166", "ENSG00000105397"],
        "hops": 3, "graph_version": "string-12.5",
        "status": "available", "reason": null
      }
    ],
    "complete_paths_ref": {
      "file": "all_paths.json",
      "candidate_id": "CHEMBL2105759",
      "bytes": 55401,
      "sha256": "763d54aba4050864cd0fd413cbdd39ca46af87cfa94e607b6db16c854522cb28"
    }
  }
}
```

Representatives are the shortest, lower-median and longest entries in the
declared ordering. For N paths, the selected positions are `0`, `(N−1)//2` and
`N−1`; with at most three paths, all are included. This exposes the distance
range. These are display representatives, not an alternative scoring set.
`score_contributing_target_count` always describes the complete calculation.
Unavailable network calculations have status/reason, an empty representative
list and zero contributing Targets, without a fabricated path or score.

Jessica can join `shortlist.json.candidates` by stable `candidate_id` and copy
each `network_paths` object into her packet assembly. Its `paths` list is capped
at three and contains no rank or z-score fields. Her existing evidence
enrichment and blinding step still controls the surrounding Candidate fields.
No packet builder, jury or frontend file was changed.

## Real examples and measured overhead

Both examples use the pinned filtered STRING graph and the original saved
shortlists. Times below are inside Python, excluding interpreter startup.

| Disease | Shortlisted Candidates | Complete verified paths | Jury representatives | Reconstruction + validation | Full enrichment/export |
|---|---:|---:|---:|---:|---:|
| Multiple myeloma, `MONDO_0009693` | 15 | 341 | 38 | 0.1472 s | 0.5816 s |
| COVID-19, `MONDO_0100096` | 15 | 106 | 43 | 0.1324 s | 0.5538 s |

Multiple myeloma example: **SUNITINIB (`CHEMBL535`)**, 67 contributing drug
Targets and 44 retained Disease Targets. Its saved mean **1.7313432835820894**
and z-score **−4.999301240523475** are unchanged. The three selected paths are:

| Hops | Drug Target → Disease Target |
|---:|---|
| 0 | `ENSG00000184216` |
| 2 | `ENSG00000102572 → ENSG00000113575 → ENSG00000070756` |
| 3 | `ENSG00000164776 → ENSG00000156873 → ENSG00000132356 → ENSG00000137693` |

COVID-19 example: **BARICITINIB (`CHEMBL2105759`)**, six contributing drug
Targets. Its mean **1.5**, z-score **−3.313821001165598**, direct rank **4**,
network rank **29** and shortlist membership are unchanged. The JSON above
contains its three representatives. Its complete six paths are:

| Hops | Drug Target → Disease Target |
|---:|---|
| 1 | `ENSG00000096968 → ENSG00000105397` |
| 0 | `ENSG00000105397` |
| 3 | `ENSG00000115977 → ENSG00000161203 → ENSG00000142166 → ENSG00000105397` |
| 1 | `ENSG00000162434 → ENSG00000105397` |
| 2 | `ENSG00000168610 → ENSG00000096968 → ENSG00000105397` |
| 2 | `ENSG00000184640 → ENSG00000186868 → ENSG00000125730` |

The hop sum is 9 across six Targets, reproducing 1.5. All 67 myeloma-example
paths, including those outside its three representatives, are retained in the
complete artifact.

## Files and validation

Each ignored example directory under `data/ranking/network-paths-v1/` contains:

- `ranking.json`: full enriched ranking; every original Candidate and score
  remains present.
- `shortlist.json`: shortlisted Candidate objects in the original order, each
  with at most three paths. It is a packet-assembly view, not a new evaluation
  universe.
- `all_paths.json`: every per-Target path for every shortlisted Candidate,
  plus contributor counts, excluded-Target records, policies and provenance.
- `manifest.json`: input and Stage 1 manifest hashes, code hash, artifact
  provenance, output hashes, counts and measured timings.

Complete-path artifact sizes are **145,199 bytes** for myeloma and **55,401
bytes** for COVID-19. Shortlist views are **210,156** and **116,867 bytes**.

The 12 new synthetic tests cover direct overlaps, endpoint and route ties,
unsorted neighbor storage, distinct graph/matrix indexes, missing/disconnected
Targets, unreachable sentinels, absent edges, inconsistent matrices/means,
representative selection, unavailable Candidates, mutation isolation, original
field preservation, API compatibility, deterministic exports and overwrite
protection. All 68 existing tests pass alongside them.

Independent real-data verification used a separate multi-source graph BFS to
check **all 447 paths** against both graph edges and the saved distance matrix.
It checked all original fields, shared API validation and identical Stage 3
evaluation cases. Replaying both exports produced byte-identical
`ranking.json`, `shortlist.json` and `all_paths.json`; only the timing manifest
varies. Results are in
`data/ranking/network-paths-v1/verification.json`; replay bundles are in
`data/ranking/network-paths-v1-replay/`. Existing source rankings, graph
artifacts, smoke-test metrics and reference labels were not overwritten.
