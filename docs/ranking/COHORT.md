# Collect and evaluate an additional Disease cohort

The collector prepares inputs and references; it does not change the Stage 2
scorer or Stage 3 evaluator. The measured first run and its label-quality
limitation are in [COHORT_RESULTS.md](COHORT_RESULTS.md).

## Reproduce the frozen run

The complete local bundle is under the ignored directory
`data/evaluation/cohort-ot26.09-v1/`. Preserve that directory and the matching
working-tree source files: `freeze.json` hashes source code as well as data.
An editable-install Git revision alone does not identify uncommitted code.

```powershell
.\.venv-ranking\Scripts\python.exe -m unittest discover -s ranking/tests -q
.\.venv-ranking\Scripts\python.exe -m ranking.cohort verify --root data/evaluation/cohort-ot26.09-v1
.\.venv-ranking\Scripts\python.exe -m ranking.cohort_report --root data/evaluation/cohort-ot26.09-v1
```

Reporting verifies the seal, archived API versions, all benchmark output hashes,
all Disease Target inputs reconstructed offline through Jessica's pipeline,
all accepted/rejected labels reconstructed from the raw tables, a byte-identical
Stage 3 replay and one deterministic Stage 2 replay. Timestamp/runtime fields
are excluded only from the Stage 2 replay comparison. It does not change labels
or rank orderings. The separate post-ranking interpretation audit under
`mechanism_audit/` is never a scoring or evaluation-label input.

## Collect a new version

Optional collection dependencies match Jessica's lockfile: DuckDB 2.0.0 and
HTTPX 0.28.1. Install `./ranking[benchmark]` in a suitable Python environment.
The normal ranking dependencies remain unchanged.

```powershell
.\.venv-ranking\Scripts\python.exe -m ranking.cohort collect --root data/evaluation/another-cohort-version --protocol ranking/cohort_protocol.json
.\.venv-ranking\Scripts\python.exe -m ranking.cohort verify --root data/evaluation/another-cohort-version
.\.venv-ranking\Scripts\python.exe -m ranking.cohort run --root data/evaluation/another-cohort-version
```

Use a new versioned directory and a reviewed protocol when changing cases,
labels or inclusion rules. Collection refuses an existing seal, and execution
refuses existing ranking/evaluation directories. Partial collection can reuse
archived responses before sealing. A failed execution is left visible for
diagnosis rather than overwritten or silently retried with different settings.

The tracked [protocol](../../core/ranking/cohort_protocol.json) predeclares 16 names, eight areas,
coverage criteria, approval-record criteria, seeds and exclusions. Name
resolution uses unique exact canonical names, then unique exact synonyms from
the pinned Disease table. Unknown or ambiguous names are reported, not guessed.
COVID-19 and myeloma are excluded from this new cohort by protocol.

Jessica's unmodified `pipeline.disease_targets` and `pipeline.opentargets` are
copied from commit `181f4ac755512cc4c42654c8a35b1468a13bb4af` into the ignored
bundle. The collector calls the same `disease_targets()` implementation used
by `python -m pipeline.disease_targets ID --out FILE`, with a recording client.
Every response includes checked API metadata for 26.09. Full association pages
are retained, default scores are validated by her code, and the top 50 Targets
are selected by `evidence_only` before coverage checks. No source file on her
branch or in the working tree is modified.

## Inspected release schemas and label boundary

The release's S3 listings contain one Parquet part for each table. The collector
records the listing, exact object URL, size, SHA256, ETag, last-modified time,
row count and complete schema, and fails on missing required fields, duplicate
record IDs or an unexpected multi-part layout.

| Dataset | Rows | Required fields |
|---|---:|---|
| `disease` | 45,896 | `id`, `name`, `exactSynonyms`, `obsoleteTerms` |
| `clinical_indication` | 86,451 | `id`, `drugId`, `diseaseId`, `maxClinicalStage`, `clinicalReportIds` |
| `clinical_report` | 289,954 | `id`, `source`, `clinicalStage`, `type`, `drugs`, `diseases`, `url` |

`clinicalReportIds` is a string array. A report's `drugs` and `diseases` are
arrays of structs with `drugId` and `diseaseId`. The collector requires an
exact-pair indication, approval stage on both indication and supporting report,
report type `INDICATION`, an allowed regulator source and a source URL.
It rejects linked regulatory withdrawals and missing report references.

The fixed approved Candidate universe comes from the existing Stream A drug
Target release. Exact Candidate IDs match directly. A salt/variant can map
only through a unique declared alias and an API-verified matching parent.
Ambiguous/conflicting variants remain explicit outside-universe relationships.
Accepted records retain original drug IDs, source records and eligibility;
duplicate variants count once per normalized Disease–Candidate label.

Stage 3 receives the existing `format_version=1` reference contract with
`cases[].disease_id` and `known_candidate_ids`. Detailed records are in
`relationships.json`/CSV and `reference_diagnostics.csv`; `label_exclusions`
retains rejected indication records and reasons. Unknown relationships are
not negatives. The same eligible universe is used for every method, with the
existing `unretrieved` missing-score policy and separate common-scorable scope.

## Scientific boundary

This implements **regulatory-metadata relationship recovery**. It does not
establish that every source annotation matches the regulatory text. The first
run found a concrete counterexample: trientine–rheumatoid arthritis passes the
Open Targets metadata filters, while the linked DailyMed label advises against
that use. The report and a separate archived label flag this contradiction;
the sealed labels and metrics were preserved. A clinically validated reference
release requires source-text adjudication and a new version before its next
evaluation. The collector must not be advertised as producing verified clinical
approval ground truth automatically.

Mechanism coverage is also source-qualified. A `non_human_target` flag can mean
a nonprotein entity such as copper rather than a pathogen. The interpretation
audit distinguishes those entities; human bioactivity alone does not prove a
human primary mechanism for a clinical use. Unscorable drugs remain visible.
Direct treatment labels are excluded from ranking features, but shared
literature, target curation and network study bias permit residual indirect
leakage. These results are not prospective predictions or treatment probabilities.
