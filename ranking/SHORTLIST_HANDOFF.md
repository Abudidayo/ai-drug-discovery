# Selectable shortlists — handoff, 25 October 2026

Implemented as an opt-in extension. The application default remains **zscore**.
No existing scoring module, graph, jury code, panel, prompt, frozen manifest or
previous result was edited. Network association is not treatment-success probability.

## Application selection

```python
from ranking.shortlist import ShortlistSettings, project_shortlist, select_shortlist

# ranking_payload is an existing full ranking with rwr.physical results.
settings = ShortlistSettings(method="physical_rwr")
selection = select_shortlist(ranking_payload, settings)  # versioned selection only
application_payload = project_shortlist(ranking_payload, settings)  # new deep copy
```

Jessica and Abudi can explicitly use the new projection; no jury integration
has been switched. `ShortlistSettings()` and the existing rank command retain
the original z-score method. The application should choose the method explicitly
and display `shortlist_selection.selection_method` alongside selection metadata.

```powershell
& .\.venv-ranking\Scripts\python.exe -m ranking.shortlist `
  --ranking data/ranking/shortlist-methods-v1/integration-examples/MONDO_0009693/ranking.json `
  --method physical_rwr --out data/ranking/application-opt-in-v1/myeloma.json
```

Use `--method zscore` for the original policy. Output paths must be new files.
The selector reuses the unchanged legacy quota/fill implementation:

- Initial 10 valid network results plus the first 5 positive direct-evidence results.
- Initial overlaps have lane `both`. Fill vacancies from subsequent supported
  evidence, then valid network results, retaining 15 unique stable Candidate IDs
  where the union supports it. For example, five overlaps produce the top 10
  network Candidates plus five additional supported evidence Candidates.
- An unavailable network result cannot enter its network lane; it can still enter
  the evidence lane. Exhausted pools produce explicit lane warnings and a shortfall
  reason, without unsupported padding.

Both methods use the same upstream approved universe and direct-evidence order.
Ties use ascending ChEMBL ID after the existing score keys (z then distance;
RWR descending mass; evidence descending score then breadth).

`shortlist_selection` uses contract `oxhack.shortlist.v1`, `format_version=1`:
method, quotas, scoring settings/seed, graph version/manifest, eligible-universe
hash, coverage, selected IDs, ordered entries with rank, lane, lane ranks and
selection reasons, and shortage diagnostics. Selection itself uses no randomness.
The projection updates only shortlist IDs, Candidate selection fields and the
shortlist-size summary; original selection fields remain in
`legacy_shortlist_selection`. All scores, score ranks and `network_paths` stay
verbatim. The new `shortlist_selection` is authoritative; the retained original
`provenance.shortlist_policy` documents the legacy source payload.

`network` remains shortest-path/z-score output; `rwr.physical` and
`rwr.functional` remain separate results with their own status/coverage/rank.
Paths explain shortest-path proximity, **not RWR diffusion**. RWR Target
contributions remain in `rwr.physical.highest_contributing_targets`.

## Real integration examples, not replication results

Separate ignored output directory:
`data/ranking/shortlist-methods-v1/integration-examples/<Disease ID>/`.
Each contains an enriched source `ranking.json`, full `zscore.json` and
`physical_rwr.json` projections, compact `*.selection.json` files, preserved
`all_paths.json`, and a checksummed manifest. Both full projections passed the
existing shared API Candidate validator.

| Input | Eligible | Physical network scorable | Positive-evidence pool | Unique IDs per method | Shared selection IDs | Generation time |
|---|---:|---:|---:|---:|---:|---:|
| Multiple myeloma `MONDO_0009693` | 1,956 | 1,307 (66.82%) | 30 | 15 | 7 | 2.874 s |
| COVID-19 `MONDO_0100096` | 1,956 | 1,307 (66.82%) | 26 | 15 | 6 | 2.399 s |

Both z-score selections exactly reproduce their original IDs, order and selection
events. The 649 missing physical graph scores remain outside the network lane;
they remain eligible for evidence selection. Original functional RWR coverage is
1,383/1,956; functional scores do not determine either new shortlist.

The first three physical-RWR network entries are:

| Input | Candidate | Mean RWR mass | Physical RWR rank |
|---|---|---:|---:|
| Myeloma | `CHEMBL790` chlorhexidine | 0.00995630435 | 1 |
| Myeloma | `CHEMBL4535757` sotorasib | 0.00784801706 | 2 |
| Myeloma | `CHEMBL4594350` adagrasib | 0.00784801706 | 3 |
| COVID-19 | `CHEMBL4298211` pegcetacoplan | 0.01176661755 | 1 |
| COVID-19 | `CHEMBL254316` raltegravir | 0.00859725420 | 2 |
| COVID-19 | `CHEMBL1201557` interferon alfacon-1 | 0.00490177747 | 3 |

These are association rankings, not claims of established treatment for these
Diseases. No reference labels were opened for generating these examples.
Myeloma RWR was calculated using the unchanged solver (physical 59 iterations,
0.252 s including Candidate scoring; functional 54 iterations, 0.352 s).
COVID-19 reused its existing physical/functional scores. No graph was rebuilt.
Both methods retain the old complete path files; the original 15 Candidate path
objects remain unchanged. Seven myeloma and six COVID-19 physical-RWR selected
Candidates already carry those proximity explanations. Newly selected Candidates
without a prior explanation have no invented paths: the existing `ranking.paths`
provider can reconstruct their proximity paths in a separately generated bundle.

## Independent 14-Disease comparison

Code is ready; **the official replication has not run**. Its published protocol,
frozen 14-Disease list, Target files and versioned reference labels are awaited.
No replacement cohort was collected or evaluated. The only end-to-end comparison
test uses explicitly synthetic inputs in a temporary directory.

Before any new labels are loaded, create/verify an implementation seal:

```powershell
& .\.venv-ranking\Scripts\python.exe -m ranking.shortlist_comparison seal `
  --out data/evaluation/shortlist-comparison-v1/implementation.json
& .\.venv-ranking\Scripts\python.exe -m ranking.shortlist_comparison verify `
  --seal data/evaluation/shortlist-comparison-v1/implementation.json
```

The seal records every `ranking/*.py` source hash, dependency versions, both
10+5 policies, z-score settings (200 samples, seed 0, bins >=100), physical STRING
12.5 c700/direct-experiments400 filters, RWR restart 0.3/tolerance 1e-12/limit1000,
and paired Disease-bootstrap settings (1,000 resamples, seed 0). The `seal`
command does not accept a reference path or Disease list. A code/dependency/settings
change invalidates the seal. Review the supplied published protocol against this
contract **before** label access; if it requires a different analysis, resolve
that and make a new seal first. This command records the protocol file hash;
it does not interpret or verify publication of the supplied document.

Implementation seal generated and verified in this handoff:
`data/evaluation/shortlist-comparison-v1/implementation.json`, implementation SHA256
`a58bad6a56b692ef64164d19d1a974915bd03d929af410be2ae9fa9efad04647`.
The seal already exists locally; use `verify` rather than rerunning `seal` on it.

Future official invocation (all `OFFICIAL_*` paths below are placeholders):

```powershell
& .\.venv-ranking\Scripts\python.exe -m ranking.shortlist_comparison compare `
  --seal data/evaluation/shortlist-comparison-v1/implementation.json `
  --cases OFFICIAL_CASE_LIST.json --targets-dir OFFICIAL_TARGET_DIRECTORY `
  --references OFFICIAL_VERSIONED_REFERENCES.json --protocol OFFICIAL_PROTOCOL_FILE `
  --drugs PINNED_DRUG_TARGET_RELEASE.json `
  --artifacts data/ranking/string-12.5-c700-e400 `
  --out data/evaluation/shortlist-comparison-v1/official-run-v1
```

Input contracts:

- Case-list JSON: `format_version=1`, nonempty `cohort_id`, `cases` containing
  exactly 14 unique `disease_id` values and `targets_file` paths relative to
  `--targets-dir`. Target inputs use the existing Stream A evidence_only contract.
- References: existing Stage 3 `format_version=1`, `definition`, nonempty
  `releases` and `source_files`, and `cases` with `disease_id` and
  `known_candidate_ids`. Supply the protocol-approved relationships; this command
  does not curate or infer indication approval. Stable ChEMBL IDs must already be
  resolved upstream; no name matching or retrospective label additions occur.
- The drug release is loaded by the existing regulator-backed eligibility loader;
  its exact bytes, eligible IDs/hash and exclusions are pinned. The existing graph,
  distance matrix, indices, all artifact files, Target files, cases, protocol and
  reference-file bytes are hashed before scoring. The scorer never receives labels.

The command verifies the seal, writes `inputs.freeze.json`, computes both
shortlists using saved distances/current RWR, freezes them in
`shortlists.freeze.json`, then parses references. It checks inputs again before
label parsing. Existing directories are never overwritten; failures are recorded.

Outputs include Candidate ranking/projection JSON per Disease, `results.json`,
`per_disease.csv`, `reference_membership.csv`, `REPORT.md`, timings and a complete
output checksum manifest. Every supplied reference pair is recorded with eligibility,
both shortlist membership flags and both network-coverage flags. Missing Disease
labels/empty positives/outside-universe positives have explicit statuses and null
metrics; unscorable eligible positives remain denominator misses unless selected
through evidence. There is no silent scorable-subset filtering.

Metrics include per-Disease fraction retrieved (Recall@15), any-hit indicator,
eligible/retrieved pair counts, Candidate/reference coverage, macro and micro
recall, and paired physical-RWR-minus-z-score differences. Both fractional recall
and any-hit differences have 95% paired Disease-bootstrap intervals and
wins/losses/ties. No small-sample superiority claim is made. Results are labelled
retrospective known-relationship recovery because incomplete references and
residual indirect same-release leakage remain possible.

## Validation

`python -m unittest discover -s ranking/tests -v`: **113 passed** (93 existing,
20 new), 2.183 s. New tests cover deterministic ties, quotas, overlap/deduplication,
missing/convergence-invalid scores, evidence fallback, shortlist shortages,
immutable projection, multiple positives, missing labels, common universes,
paired uncertainty and sealing. A synthetic 14-case file round trip verifies
eligibility exclusions, coverage, no treatment-label features, CSV/JSON output,
and freezing both shortlist sets before reference parsing.

The existing 16-Disease bundle verified; the prior RWR freeze's 459 protected
external inputs/artifacts/reports and its 65 result files verified unchanged.
All generated examples and the implementation seal are under ignored `data/`.
No large asset was added to Git. Only new ranking modules/tests, this handoff and
a Trail learning are added.
