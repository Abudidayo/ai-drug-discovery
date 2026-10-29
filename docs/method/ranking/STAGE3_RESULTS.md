# Stage 3 — retrospective known-relationship recovery

**2-Disease smoke test; the ten-Disease research pilot is not complete.**

Evaluation manifest content SHA-256: `1b726faebbf30a65a3a43bbfdd952131dd1fa0b41341f112bb2f479b32a18e29`.

No labels were fed back into scoring. References are evaluated as recorded; unlabelled relationships are not negative controls.

**Observed outcome:** network z-score MRR is slightly below direct evidence on
these two examples; both have zero Recall@5, @10 and @20. Saved-shortlist
Recall@15 is zero in both full universes. This negative smoke-test finding does
not establish general superiority or inferiority of either method.

## Coverage

| Disease | Eligible | Common scorable | Known eligible | Known common |
|---|---:|---:|---:|---:|
| MONDO_0009693 | 1956 | 1307 | 32 | 25 |
| MONDO_0100096 | 1956 | 1307 | 1 | 0 |

The common-scope averages below evaluate **myeloma only**. Remdesivir, the sole
COVID-19 reference recorded in the supplied indication data, is not network
scorable. COVID-19 therefore has null common-scope metrics with the explicit
reason `no_positive_in_scope`, rather than a silently dropped reference or a
fabricated zero-performance observation. No baricitinib label was inserted.

## full_eligible: macro averages over labelled Diseases with positives in scope

| Method | Evaluated Diseases | Recall@5 | Recall@10 | Recall@20 | MRR |
|---|---:|---:|---:|---:|---:|
| direct_evidence | 2 | 0.000000 | 0.000000 | 0.000000 | 0.021224 |
| shared_targets | 2 | 0.000000 | 0.000000 | 0.015625 | 0.025391 |
| raw_proximity | 2 | 0.000000 | 0.000000 | 0.000000 | 0.003289 |
| degree_matched_z | 2 | 0.000000 | 0.000000 | 0.000000 | 0.020000 |
| random | 2 | 0.000000 | 0.000000 | 0.000000 | 0.024548 |

## common_scorable: macro averages over labelled Diseases with positives in scope

| Method | Evaluated Diseases | Recall@5 | Recall@10 | Recall@20 | MRR |
|---|---:|---:|---:|---:|---:|
| direct_evidence | 1 | 0.000000 | 0.000000 | 0.000000 | 0.041667 |
| shared_targets | 1 | 0.000000 | 0.000000 | 0.040000 | 0.050000 |
| raw_proximity | 1 | 0.000000 | 0.000000 | 0.000000 | 0.006579 |
| degree_matched_z | 1 | 0.000000 | 0.000000 | 0.000000 | 0.040000 |
| random | 1 | 0.000000 | 0.000000 | 0.040000 | 0.071429 |

## Paired network z-score minus direct evidence

| Scope | Paired Diseases | Δ Recall@5 | Δ Recall@10 | Δ Recall@20 | Δ MRR |
|---|---:|---:|---:|---:|---:|
| full_eligible | 2 | 0.000000 | 0.000000 | 0.000000 | -0.001224 |
| common_scorable | 1 | 0.000000 | 0.000000 | 0.000000 | -0.001667 |

## Frozen Stage 2 shortlist Recall@15

| Disease | Scope | Selected | Known selected | Known in scope | Recall@15 |
|---|---|---:|---:|---:|---:|
| MONDO_0009693 | full_eligible | 15 | 0 | 32 | 0.000000 |
| MONDO_0009693 | common_scorable | 15 | 0 | 25 | 0.000000 |
| MONDO_0100096 | full_eligible | 15 | 0 | 1 | 0.000000 |
| MONDO_0100096 | common_scorable | 15 | 0 | 0 | n/a |

## Interpretation and limitations

- Full-universe missing-score policy: `unretrieved`. Under `unretrieved`, missing scores have no retrieved rank and count as misses; eligible positives remain in Recall denominators. `append_by_id` instead puts missing entries last, ordered by ID.
- Every method uses the same eligible Candidate IDs within each Disease. The common subset is the intersection of all four score-available sets, not a method-specific filtered dataset. Missing labels or no positives in scope produce null metrics and explicit macro exclusions, not zeros.
- Recall@K counts all known in-scope Candidates recovered in the first K, divided by all known in-scope Candidates. MRR averages each Disease's reciprocal rank of its first known Candidate; it does not average over every positive within a Disease.
- Shortlist Recall@15 uses the saved selection unchanged. Common-scope evaluation filters that same shortlist without refilling it. The random baseline is one reproducible, seed-keyed hash permutation, not an average over many random rankings.
- Bootstrap 95% intervals and exact evaluated case lists are in JSON/aggregate.csv. With only two examples, intervals are descriptive and cannot support a general research conclusion; fewer than two evaluable cases produces no interval.
- These inputs were frozen for reproducibility after ranking development; this is not prospective preregistration, an out-of-time test, or clinical validation.
- Direct clinical-precedence and cancer-biomarker channels are declared excluded, and explicit treatment-label fields in Candidate features are rejected. Literature co-mentions, curated targets, network study bias and shared source releases may still leak known relationships indirectly.
- The supplied Disease features contain only 50 association scores each. Approval/indication labels define evaluation relationships; global approval-source provenance only defines the already-fixed eligible universe.
- Reference limitation: Same-release source labels, not independent external validation or complete clinical ground truth.
- Reference limitation: Regulator provenance is aggregated per drug, not verified here for each Disease indication.
- Reference limitation: Missing relationships are unlabelled, not proven ineffective; no label is added from memory or a known-answer example.
- Network proximity, retrieval recall and model agreement are not treatment-success probabilities.

Full per-Disease metrics, ranks, missing IDs, coverage and paired comparisons are in results.json and CSV files beside this report.

## Executed validation and integration

- All **52 tests passed**, covering the original network/ranking suites and
  Stage 3 metric correctness, multiple positives, missing labels/scores, ties,
  coverage, reference extraction, label-field rejection, exports and API fields.
- All nine real evaluation files replayed byte-for-byte, including manifest,
  CSV/JSON results, frozen references and generated Markdown, with reversed input
  ranking-file order. The manifest content hash above matched exactly.
- Stream A inputs, Stage 1 artifacts and original Stage 2 ranking outputs were
  verified unchanged by byte size and SHA-256. No scoring implementation or
  teammate pipeline was changed.
- The raw Stage 2 Candidates lack `evidence`, `warnings`, `safety_status` and
  `dockable` from `plan.md` section 9.2. `ranking.integration.adapt_ranking` adds
  those fields locally and validates all **1,956 Candidates per Disease**.
  Original scores, ranks and selection fields are preserved; repeated adaptation
  is idempotent, and existing supplied enrichment is preserved.
- Both exported payloads explicitly mark all 1,956 Candidates as awaiting
  evidence/safety/structure enrichment. Empty arrays mean not supplied, safety
  remains unknown, and `dockable=false` means no verified structure was supplied.
  No citations, warnings, structures or scientific support were invented.
- Candidate-field compatibility is checked against the documented fixture.
  No deployed API or full formal Experiment schema is present in this checkout,
  so no claim of end-to-end server integration is made.

Evaluation artifacts are in `data/evaluation/stage3-smoke/`; adapted JSON files
are in `data/ranking/stage3-api/`. Both locations remain gitignored. Usage and
the reusable evaluation/reference contract are documented in `docs/method/ranking/STAGE3.md`.

There were no execution blockers. Completing the ten-Disease research pilot
requires at least eight additional Disease cases with defined reference labels;
the current sparse, same-release references are not independent external or
historical validation. The negative numbers above were not used to tune or
rewrite Stage 2.
