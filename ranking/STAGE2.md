# Stage 2 — general-purpose Candidate ranking

Stage 2 consumes the existing Stage 1 bundle. It does not download data, rebuild
STRING, recompute shortest paths, or modify Stream A. There are no Disease or
drug names/IDs hardcoded into the engine.

## Run

From the repository root, using the environment from `ranking/README.md`:

```powershell
.\.venv-ranking\Scripts\python.exe -m unittest discover -s ranking/tests -v
.\.venv-ranking\Scripts\python.exe -m ranking rank --artifacts data/ranking/string-12.5-c700-e400 --data-dir data/stream_a --disease-id MONDO_0100096 --output data/ranking/stage2/MONDO_0100096.json
```

The command writes a new complete JSON result and prints a compact summary.
Existing output files are never overwritten. Use another output filename for
repeat runs. Keep results under ignored `data/` or `ranking/artifacts/`.

The standard release naming convention is `disease_targets_{disease_id}.json`
and `drug_targets.json`. For arbitrary filenames, supply `--disease-targets`
and/or `--drugs`. Any stable Disease ID with a compatible supplied file works;
an unavailable file or mismatched Disease ID produces an explicit error. The
current checkout has only the two supplied examples, not offline data for every
Disease.

Defaults are 50 Disease Targets, 200 randomisations, seed 0 and minimum degree-bin
size 100. Configure them with `--top-targets`, `--randomisations`, `--seed` and
`--min-bin-size`. Python callers can also configure shortlist quotas through
`RankingSettings(network_slots=10, evidence_slots=5)`. Smaller bins in the tests
exercise tiny artificial graphs; the real runs use 100.

## Actual input schemas

- Disease file: `disease_id`, `disease_name`, `release`, `rule`, `targets`.
  Target rows have `target_id`, `name`, `rank` and `evidence_only_score`.
  The source rule must declare `evidence_only` and exclusion of
  `clinical_precedence` and `cancer_biomarkers`. Source `rank` is not trusted:
  sort unique Targets by descending score, then Ensembl ID; select the top 50
  **before** checking network coverage. Do not backfill excluded Targets.
- Drug file: `releases`, `rules`, `coverage`, `drugs`. Each drug has `drug_id`,
  `name`, `source_chembl_ids`, `approval`, `targets`, `unmapped`. Target rows use
  `target_id`, `name`, `support`, `action_type`, `target_type`, `median_pchembl`
  and `n_activities`. Require at least one regulator source in
  `approval.sources`: FDA, EMA Human Drugs, PMDA or DailyMed. Duplicate Candidate
  IDs are an explicit input error. Invalid/unapproved records are excluded with
  reasons. The input's canonical parent molecule IDs are preserved.

Repeated Target IDs count once. Duplicate Disease scores use their maximum;
duplicate drug Target metadata unions support and marks conflicting action types
unknown. Invalid IDs and missing/invalid Disease scores appear in exclusions.
No symbol joins or re-resolution of upstream IDs occurs. Open Targets releases
must agree across Disease, drug and Stage 1 inputs.

## Calculation and conditional null

For each LCC node, read its shortest distance to any retained selected Disease
Target from the saved matrix. The observed drug distance is the mean of that
vector at the drug's unique retained Target indices. Only LCC Targets enter the
mean. Encountering sentinel 255 in an LCC lookup fails explicitly; it is never
averaged.

The **conditional** null holds Disease Targets fixed and randomises only drug
Targets. This follows Zaid's Stage 2 instruction; `plan.md` section 4.3 now says
the same. It is a different null from randomising both Target sets.

Group adjacent whole-degree groups into bins with at least 100 LCC nodes;
merge an undersized final bin into its neighbour. Each draw matches the observed
drug's retained Target count and count in every degree bin. Sample uniformly
without replacement within the draw. Nodes may recur in later draws; observed
drug and Disease proteins remain eligible in the pools. Network degrees are
read from the saved adjacency, not reconstructed from another source.

Compute `z = (observed - randomisation_mean) / randomisation_std` using population
standard deviation (`ddof=0`). Smaller z means closer than expected under this
particular null. No p-value or treatment-success probability is produced.

Use explicit NumPy PCG64. Derive a 128-bit seed from SHA-256 of the configured
seed, Disease ID and degree-bin count profile. Cache the 200-draw distribution's
summary per profile within the Disease. Candidates with the same profile use
the same reference samples, making comparisons and exact ties reproducible;
Candidate order, Candidate names, and unrelated additions do not alter scores.
Output includes the profile, derived seed, bin boundaries and software version.

| Status | Representation |
|---|---|
| `scored` | Observed distance, random mean/std, finite z-score, network rank |
| `distance_only` | Observed distance retained, null z-score, `zero_null_variance` or `insufficient_degree_matched_pool` warning |
| `not_scorable` | `network = null`, with `no_retained_disease_targets` or `no_retained_drug_targets` reason |

An entire LCC smaller than the configured minimum pool size cannot support that
null. A bin lacking enough distinct replacements also fails explicitly. No
fabricated zero z-score or hidden relaxation of the configured bins is used.

## Baselines, ordering and shortlist

Direct evidence uses all **supplied** valid Disease scores, including Targets
outside the LCC or beyond the network's top-N selection. For each drug, take the
maximum matching score; break ties by summed score (`breadth`), then ChEMBL ID.
Shared-Target count uses unique overlaps with all supplied valid Disease Targets,
sorted descending with ChEMBL-ID ties. If no valid Disease scores exist, baseline
scores/ranks are null. With valid Disease scores, zero means no support among
the supplied records, not a demonstrated absence of a biological association.

The two current Disease files are already restricted to their top 50. The
baselines cannot recover association scores absent from those files; the result
labels this scope explicitly. `approval.disease_ids`, indication/trial labels
and docking fields are not scoring inputs.

Network ordering is ascending z, raw distance and ChEMBL ID. The following
`distance_only` group orders by raw distance and ID. `not_scorable` Candidates
remain unranked on the network and eligible for supported evidence selection.

Start with the top 10 valid network results and top 5 positive direct-evidence
results. Deduplicate, preserving both selection reasons on overlaps. Fill toward
15 from the next supported evidence entries, then remaining valid network
entries. Fill entries carry explicit reasons; the initial 10/5 quotas can be
exceeded by a documented fill when a source is short or overlaps occur. Never
fill with unsupported, scoreless Candidates merely to reach 15.

## Coverage and output contract

Every Disease/Candidate has `coverage.total`, `mapped`, `retained`, `excluded`,
individual excluded IDs/reasons, input row count and duplicate count:

- `total`: distinct IDs in the provided Targets array, plus invalid rows lacking
  IDs. This is a count of provided Target records, not a claim about all biology.
- `mapped`: valid IDs present in the saved full mapped-gene graph.
- `selected`: unique valid IDs selected before LCC filtering (top-N for Disease,
  all supplied valid drug Targets). `selected_mapped` reports their graph coverage.
- `retained`: selected IDs present in the distance-table LCC.
- `excluded = total - retained`, with invalid/missing-score, top-N, absent-graph
  and outside-LCC exclusions distinguished.

Stream A's `unmapped` records may describe mechanisms, complexes, or non-protein
Targets. Report their counts/reasons as `upstream_unmapped_items` separately;
they cannot establish a distinct-protein denominator. An unresolved item is not
silently treated as a successfully mapped Target.

The result contains `disease`, all eligible `candidates` in stable ChEMBL-ID
order, `shortlist` IDs in selection order, `summary` and `provenance`. Candidate
objects preserve the shared fields `candidate_id`, `name`, `status`, `network`,
`direct_evidence_rank`, `targets` and `selected_by`, and add baseline details,
shared-Target ranks, coverage, selection reasons and `shortlist_rank`. All
missing numeric values are JSON null, never NaN or infinity.

Merge evidence and safety information from Stream A by Candidate ID before jury
review or display. These relationship files do not contain complete citations,
warnings or structures, so Stage 2 does not fabricate those fields. Jury callers
must remove ranking fields/selection reasons and independently shuffle Candidates
as the shared plan requires. This module does not implement that jury workflow.

```python
from ranking.artifacts import load_artifacts
from ranking.data import load_disease, load_drugs
from ranking.scoring import RankingEngine, RankingSettings

drugs = load_drugs("data/stream_a/drug_targets.json")
with load_artifacts("data/ranking/string-12.5-c700-e400") as saved:
    engine = RankingEngine(saved, RankingSettings(seed=0, randomisations=200))
    # Reuse this engine for any compatible supplied Disease files.
    disease = load_disease(path_to_disease_file, disease_id)
    result = engine.rank(disease, drugs)
```

`rank_files(...)` is the one-call wrapper used by the CLI; it verifies the saved
bundle, loads inputs and attaches manifest/input hashes and total runtime.
Network proximity remains a research prioritisation measure, not evidence that
a drug treats a Disease.
