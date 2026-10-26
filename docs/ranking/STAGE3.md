# Stage 3 — evaluation and final Candidate integration contract

Stage 3 reads frozen Stage 2 outputs. It changes neither graph construction nor
Candidate scoring. Evaluation labels enter only `references.py` and
`evaluation.py`; they are never sent to the Stage 2 engine.

## Run the available smoke test

From the repository root:

```powershell
.\.venv-ranking\Scripts\python.exe -m unittest discover -s ranking/tests -v
.\.venv-ranking\Scripts\python.exe -m ranking evaluate --rankings data/ranking/stage2/MONDO_0009693.json data/ranking/stage2/MONDO_0100096.json --indications data/stream_a/drug_targets.json --output data/evaluation/stage3-smoke --seed 0 --bootstrap-samples 1000
```

Existing output directories are never overwritten. Use a new output directory
to repeat an evaluation. Identical input files/settings yield identical
manifests, metrics, CSV files and report bytes, independent of output-directory
name or ranking-file argument order. There is no wall-clock timestamp or runtime
in the frozen evaluation result.

Only two Disease Target files exist in this checkout. This is a **smoke test**;
the ten-Disease research pilot is not complete. The code does not invent Disease
files, inject known answers, fetch extra labels, or alter rankings after looking
at reference relationships.

## Separate reference relationships

Prefer an independently curated reference JSON supplied with `--references`:

```json
{
  "format_version": 1,
  "definition": "Describe the independently selected relationship source and cutoff",
  "releases": ["source-version"],
  "source_files": [{"sha256": "source hash", "bytes": 123}],
  "limitations": ["Document completeness and provenance limits"],
  "cases": [
    {"disease_id": "TEST_1", "known_candidate_ids": ["CHEMBL1", "CHEMBL2"]}
  ]
}
```

An omitted Disease case means **labels missing**, not no positives. An explicit
empty list means **no positive references supplied**. Both return null metrics
with a reason and are excluded explicitly from macro averages. Duplicate labels
count once; duplicate Disease case definitions are rejected.

`--indications` is the available-data smoke-test alternative. It freezes exact
membership in Stream A's `approval.disease_ids` for regulator-backed drugs,
without consulting scores or shortlists. The definition is independent of the
ranking, but **the data source is not independent external validation**. The
source records approval provenance per drug, not per indication. Current data
lists 32 myeloma relationships and only remdesivir for COVID-19; no familiar drug
is added to repair that sparse reference set. Unrecorded pairs remain unlabelled.

The output contains `references.json`, its source hash and label definition.
For a new independently supplied reference file, use `--references` instead of
`--indications`; they are mutually exclusive. Changing the label source produces
a different manifest even if some positive IDs happen to match.

## Metrics and fair scopes

For each Disease, Recall@K is the number of distinct known Candidates in its
first K results divided by the number of known Candidates in that evaluation
scope. K is 5, 10 and 20. MRR is the macro average of each Disease's reciprocal
rank of its **first** positive; multiple positives within a Disease do not
become separate MRR queries. A known in-scope Candidate with no retrieved rank
contributes zero, not a dropped label.

Evaluate five methods on the same frozen eligible universe for each Disease:

| Method | Ordering |
|---|---|
| `direct_evidence` | Descending supplied Target-evidence score, summed breadth, then ChEMBL ID |
| `shared_targets` | Descending shared-Target count, then ID |
| `raw_proximity` | Ascending raw mean distance, then ID |
| `degree_matched_z` | Ascending z-score, raw distance, then ID |
| `random` | Reproducible SHA-256 ordering keyed by seed, Disease ID and Candidate ID |

The evaluator reconstructs these orders from saved scores, never from reference
labels. Ties use the agreed deterministic ID ordering. Zero evidence scores
mean no supplied support; they remain real baseline values rather than missing
scores. In particular, an ID tie among zero-support Candidates is not a
biological distinction.

- **`full_eligible`:** all approved Candidate IDs and all reference positives
  eligible for that Disease stay in scope. Default `unretrieved` policy leaves
  unavailable scores without a retrieved rank. Missing IDs and missing-positive
  counts are reported per method; no denominator silently shrinks.
- **`common_scorable`:** intersect all four non-random score-available sets and
  evaluate every method on that same subset. Filter the same random permutation.
  Report positive labels lost by this restriction. A Disease with no positive
  in the common scope has null metrics for **all** methods there; report its
  exclusion from the macro average.
- `--missing-score-policy append_by_id` is an explicit alternative: put missing
  scores at the end in ID order. Missingness and coverage remain reported. It
  may give reciprocal-rank credit to an unavailable score, so it is not default.

Labels outside the full eligible universe are counted/listed separately and do
not enter the eligible-universe Recall denominator. Shortlist Recall@15 uses
the original saved shortlist, first 15 IDs, without new selection. Common-scope
shortlist metrics filter those same IDs without refilling.

Macro averages weight Diseases equally. JSON/CSV includes exact evaluated and
skipped case lists. Seeded Disease-level bootstrap intervals use 1,000 resamples
by default. Paired z-score-minus-direct-evidence comparisons resample the same
per-Disease differences. With fewer than two evaluable cases, intervals are
null. Two-case intervals are descriptive, not reliable evidence of generalisation.

## Reusable Python evaluation

```python
from ranking.evaluation import EvaluationCase, EvaluationSettings, evaluate_cases

case = EvaluationCase(
    disease_id="TEST_1",
    eligible_candidates=("CHEMBL1", "CHEMBL2"),
    rankings={
        "direct_evidence": ("CHEMBL1", "CHEMBL2"),
        "shared_targets": ("CHEMBL2", "CHEMBL1"),
        "raw_proximity": ("CHEMBL2",),
        "degree_matched_z": ("CHEMBL2",),
    },
    shortlist=("CHEMBL2",),
    provenance={"source": "your independently prepared ranked lists"},
)
results = evaluate_cases([case], {"TEST_1": {"CHEMBL1"}}, EvaluationSettings(seed=0))
```

External ranked lists must contain unique eligible IDs, with missing scores
represented by absence from that method's ordered list. The evaluator does not
assume it has audited the feature generation of arbitrary external rankings.
`case_from_stage2` additionally checks Stage 2's evidence-only declaration and
rejects explicit treatment/indication/docking label fields in Candidate features.

That structural guard does not establish that literature co-mentions, curated
drug Targets, or network construction contain no indirect leakage. All current
results are labelled **retrospective known-relationship recovery**, not future
prediction, treatment probability, or clinical validation.

## Frozen outputs

| File | Contents |
|---|---|
| `manifest.json` | Input versions/hashes, case list, feature audit, ranking settings/seeds, evaluation settings/seeds, label definition and software |
| `references.json` | Exact frozen reference relationships, sources and limitations |
| `results.json` | All per-Disease/method/scope metrics, full ordered and missing IDs, coverage, shortlist metrics, aggregates and paired differences |
| `metrics.csv` | Per-Disease metrics with score and label coverage |
| `coverage.csv` | Eligible/common sizes and positive coverage, including IDs lost outside scopes |
| `aggregate.csv` | Macro metrics, confidence intervals, evaluated and skipped cases |
| `comparisons.csv` | Per-Disease z-score-minus-direct-evidence differences |
| `shortlist.csv` | Saved shortlist Recall@15 with scope/status/denominator |
| `report.md` | Concise numbers and scientific limitations |

The manifest is written in staging **before** metric computation. Canonical
sorted-JSON SHA-256 identifies its content; results also store the actual manifest
file SHA-256. This freezes a reproducible smoke-test protocol after development,
not prospective preregistration. A complete directory is published only after
all exports succeed. Generated data stays under ignored `data/`.

## Shared Candidate API adapter

Stage 2 preserves the ranking fields from `plan.md` section 9.2, but lacks
`evidence`, `warnings`, `safety_status` and `dockable`. The small local adapter
adds them and validates Candidate IDs, statuses, Target fields, numeric scores,
enrichment types and Experiment-wide evidence-ID consistency:

```powershell
.\.venv-ranking\Scripts\python.exe -m ranking adapt --input data/ranking/stage2/MONDO_0100096.json --output data/ranking/stage3-api/MONDO_0100096.json
```

Optional `--enrichment` accepts an object keyed by Candidate ID containing those
four fields. Existing supplied enrichment is preserved, and explicit new values
can enrich it. Re-adaptation is idempotent. Conflicting evidence items with the
same `E` ID within the Experiment are rejected.

Without enrichment, evidence/warnings are empty with explicit `not_supplied`
flags, safety is `unknown`, and `dockable=false` means no verified prepared
structure was supplied. It does not claim the drug is inherently undockable or
safe. The adapter never changes a score, rank, Target coverage or selection.

This confirms **Candidate-field compatibility with the documented fixture**.
There is no deployed API implementation or formal full Experiment schema in
this checkout to test against. Evidence/safety enrichment, jury blinding and
shuffling remain separate team responsibilities; no Model jury or API server is
implemented here.
