# Stage 3 reference-label audit

Audited 24 October 2026 for Zaid. Scope: the saved COVID-19 and multiple-myeloma rankings and frozen Stage 3 evaluation. No ranking code, reference labels, source data or existing results were changed.

## Finding

**The baricitinib discrepancy is an incomplete reference relationship, not an identifier, eligibility or metric bug.** Baricitinib is eligible, network-scorable and shortlisted for COVID-19. The frozen reference source does not list COVID-19 among its indication IDs, so Stage 3 does not count it as a positive. The only frozen COVID-19 reference is remdesivir, which has no supplied human Target IDs and is not shortlisted. Consequently full-universe shortlist Recall@15 is correctly **0/1 = 0**, while common-scorable COVID-19 metrics are **null**, with `no_positive_in_scope`.

The arithmetic is correct for the recorded labels. Those labels are demonstrably incomplete and are not a complete list of approved treatments. These results cannot establish that the shortlist missed baricitinib or all established COVID-19 treatments. No metric correction or retrospective insertion of baricitinib is warranted.

All **52 tests pass**. A fresh Stage 3 replay produced **nine byte-identical files**, including the references, manifest, JSON, CSVs and report. Independent calculations also matched all 20 Disease/scope/method metric rows, ten macro rows and four shortlist rows.

## Inputs and reference definition

The audit used the actual files:

- `data/stream_a/drug_targets.json`, `string_id_map.json`, and the two `disease_targets_MONDO_*.json` files.
- Saved Stage 1 artifacts in `data/ranking/string-12.5-c700-e400/`, without rebuilding the graph or distances.
- Saved Stage 2 results in `data/ranking/stage2/MONDO_0009693.json` and `MONDO_0100096.json`.
- Frozen Stage 3 bundle in `data/evaluation/stage3-smoke/`, particularly `references.json`, `manifest.json`, `results.json` and the CSVs.

Reference extraction ([references.py](../../core/ranking/references.py:8)) uses exact membership in `approval.disease_ids` for a drug whose aggregate `approval.sources` includes FDA, EMA Human Drugs, PMDA or DailyMed. It never derives labels from ranks, scores, shortlist membership or a known-answer example. The extracted sets match the source exactly: **32 myeloma references and one COVID-19 reference**.

Approval provenance is aggregated **per drug**, not attached to individual indication IDs. Thus the provider column below reports the available drug-level provenance; it does not certify that each provider approved that specific Disease relationship. The reference set measures recorded indication relationships, which can include supportive uses, rather than a uniformly verified set of Disease-modifying therapies. No such clinical classification was added in this audit.

The evaluation unit is the stable ChEMBL Candidate ID. For example, IXAZOMIB and IXAZOMIB CITRATE are separate supplied records and reference entries. These metrics do not claim to count distinct active ingredients or treatment regimens; this audit did not introduce additional molecule-level merging.

## Every frozen reference Candidate

All rows originate in `data/stream_a/drug_targets.json` → `approval.disease_ids`. Provider abbreviations: **D** = DailyMed, **E** = EMA Human Drugs, **F** = FDA, **P** = PMDA. All 33 references are in their respective 1,956-Candidate eligible universes; none is lost through a Candidate-ID or approval-source filter during evaluation.

Coverage is **T/M/R/X**: unique supplied Target IDs / IDs in the full mapped graph / IDs retained in the largest connected component / excluded IDs (`T − R`). It does not count unresolved upstream records as supplied gene IDs. “Network rank” is the saved degree-matched z-score rank, not the raw-distance rank. Ranks are one-based in the full eligible ranking. `—` means no valid network score, not rank zero. Every such row has `status=not_scorable`, reason `no_retained_drug_targets`; other rows have `status=scored`.

### Multiple myeloma — `MONDO_0009693`

| Candidate | ChEMBL ID | Providers | Eligible | Coverage T/M/R/X | Direct rank | Network rank | Shortlist |
|---|---|---|---|---|---:|---:|---|
| INTERFERON ALFA-2B | CHEMBL1201558 | D,E,F | Yes | 2/2/2/0 | 312 | 587 | No |
| HYALURONIDASE (HUMAN RECOMBINANT) | CHEMBL1201718 | P | Yes | 0/0/0/0 | 362 | — | No |
| DENOSUMAB | CHEMBL1237023 | D,E,P | Yes | 1/1/1/0 | 425 | 280 | No |
| DARATUMUMAB | CHEMBL1743007 | D,E,P | Yes | 1/1/1/0 | 682 | 283 | No |
| ELOTUZUMAB | CHEMBL1743010 | D,E,P | Yes | 1/1/0/1 | 683 | — | No |
| PLERIXAFOR | CHEMBL18442 | D,E | Yes | 4/3/3/1 | 735 | 1121 | No |
| IXAZOMIB | CHEMBL2141296 | E | Yes | 37/37/36/1 | 957 | 1254 | No |
| BORTEZOMIB | CHEMBL325041 | D,E,P | Yes | 38/38/37/1 | 1103 | 1251 | No |
| ISATUXIMAB | CHEMBL3545131 | E,F,P | Yes | 1/1/1/0 | 1153 | 288 | No |
| SELINEXOR | CHEMBL3545185 | D,E,F | Yes | 2/2/2/0 | 1156 | 94 | No |
| IXAZOMIB CITRATE | CHEMBL3545432 | D,P | Yes | 37/37/36/1 | 1166 | 1255 | No |
| DEXAMETHASONE | CHEMBL384467 | D,E,P | Yes | 6/6/6/0 | 24 | 238 | No |
| ELRANATAMAB | CHEMBL4297809 | E,F,P | Yes | 4/4/4/0 | 1377 | 486 | No |
| IDECABTAGENE VICLEUCEL | CHEMBL4298199 | E | Yes | 1/1/1/0 | 1427 | 354 | No |
| BELANTAMAB MAFODOTIN | CHEMBL4298209 | D,E,F | Yes | 13/13/13/0 | 1430 | 1002 | No |
| MELPHALAN FLUFENAMIDE | CHEMBL4303060 | E,F | Yes | 0/0/0/0 | 1437 | — | No |
| POMALIDOMIDE | CHEMBL43452 | D,E,P | Yes | 8/8/8/0 | 1443 | 215 | No |
| CARFILZOMIB | CHEMBL451887 | D,E,P | Yes | 37/37/36/1 | 1464 | 1256 | No |
| TALQUETAMAB | CHEMBL4594503 | E,F | Yes | 4/4/3/1 | 1504 | 638 | No |
| TECLISTAMAB | CHEMBL4594505 | E,F,P | Yes | 4/4/4/0 | 1505 | 487 | No |
| THALIDOMIDE | CHEMBL468 | D,E,P | Yes | 4/4/4/0 | 1537 | 212 | No |
| CILTACABTAGENE AUTOLEUCEL | CHEMBL4802263 | E | Yes | 1/1/1/0 | 1554 | 355 | No |
| PANOBINOSTAT | CHEMBL483254 | D,E,P | Yes | 13/13/13/0 | 1556 | 25 | No |
| LINVOSELTAMAB | CHEMBL5095373 | E | Yes | 0/0/0/0 | 1592 | — | No |
| MOTIXAFORTIDE ACETATE | CHEMBL5095449 | F | Yes | 0/0/0/0 | 1594 | — | No |
| CARMUSTINE | CHEMBL513 | D,E,F,P | Yes | 2/2/2/0 | 1602 | 306 | No |
| DOXORUBICIN | CHEMBL53463 | D,E,P | Yes | 2/2/2/0 | 1650 | 257 | No |
| LENALIDOMIDE | CHEMBL848 | D,E | Yes | 5/5/5/0 | 1874 | 241 | No |
| MELPHALAN | CHEMBL852 | D,E | Yes | 0/0/0/0 | 1876 | — | No |
| CYCLOPHOSPHAMIDE ANHYDROUS | CHEMBL88 | D | Yes | 0/0/0/0 | 1891 | — | No |
| VINCRISTINE | CHEMBL90555 | P | Yes | 16/16/16/0 | 1907 | 961 | No |
| ZOLEDRONIC ACID ANHYDROUS | CHEMBL924 | D,E,P | Yes | 3/3/2/1 | 1917 | 730 | No |

### COVID-19 — `MONDO_0100096`

| Candidate | ChEMBL ID | Providers | Eligible | Coverage T/M/R/X | Direct rank | Network rank | Shortlist |
|---|---|---|---|---|---:|---:|---|
| REMDESIVIR | CHEMBL4065616 | F | Yes | 0/0/0/0 | 1280 | — | No |

Remdesivir's source `targets` list is empty. The upstream unresolved records include two `non_human_target` entries (`CHEMBL4303062`, `CHEMBL4523582`) and two `missing_target_mapping` entries (RNA-directed RNA polymerase L; Replicase polyprotein 1ab). There is no supported human gene Target to score in the supplied release. A human-host network cannot assign it proximity from those records. Its direct-evidence score and shared-Target count are both zero; rank 1280 is determined by the declared ChEMBL-ID tie-break among zero-score Candidates, not positive evidence.

## Baricitinib trace

Baricitinib is shown separately because it is **not in the frozen COVID-19 reference set**.

| Check | Observed value |
|---|---|
| Stable Candidate ID | `CHEMBL2105759` in source and saved ranking |
| Eligibility | Eligible; source providers D,E,F,P |
| Identifier normalization | One source row; `source_chembl_ids=["CHEMBL2105759"]`; no alias collision or alternate reference ID |
| Frozen indication IDs | `MONDO_0004980`, `MONDO_0008383`, `MONDO_0011429`; **no `MONDO_0100096`** |
| COVID-19 direct evidence | Rank **4**, score **0.6037436223612329** |
| Network status / coverage | `scored`; **7/6/6/1** |
| COVID-19 network result | Rank **29**; raw mean distance **1.5**; z-score **−3.313821001165598** |
| Conditional null | Mean **2.2325**, SD **0.2210439247449852**; 200 randomisations |
| Shared Targets | Count **1**, rank **12** |
| Shortlist | **Yes**, position **14**, `selected_by=evidence`, reason `initial_evidence_quota` |

The six retained Targets are JAK2, TYK2, AAK1, JAK1, STAT3 and SEPTIN9. BMP2K (`ENSG00000138756`) is excluded as `not_in_graph`. The retained set supports the actual network score; baricitinib is not among the 649 unscorable Candidates. The direct-evidence selection explains its inclusion despite network rank 29.

The FDA label explicitly includes baricitinib for hospitalized adults with COVID-19 who need supplemental oxygen, ventilatory support or ECMO. The inspected label is revised June 2026, supplement 011, Reference ID 5826077. This confirms the missing clinical relationship independently of the rankings. [FDA OLUMIANT label, sections 1.2 and 14.2](https://www.accessdata.fda.gov/drugsatfda_docs/label/2026/207924s011lbl.pdf).

To investigate the source gap, a **separate audit-only** query of the [Open Targets GraphQL endpoint](https://api.platform.opentargets.org/api/v4/graphql) was saved at `2026-10-24T22:34:49.360Z`. It returns the exact drug and Disease IDs, no parent molecule and no obsolete COVID-19 terms. Of 71 drug-indication rows, the COVID-19 row is `PHASE_3` with 22 ClinicalTrials.gov reports and no regulator reports. The regulator-backed `APPROVAL` rows correspond to the three indication IDs stored in the local source. An additional `APPROVAL` row for juvenile dermatomyositis has trial-only provenance and fails the regulator-source requirement.

This live response is consistent with the omission under the documented approval criteria ([build-reference.md, A6](../build-reference.md:169)). It corroborates an upstream relationship-curation gap; the original raw export is unavailable, so it cannot prove the precise historical extraction steps. The live API response is unversioned in this snapshot and must not be represented as a verified replay of release 26.09. Neither this response nor the FDA label was added to the frozen evaluation.

## Coverage and the 649 `not_scorable` Candidates

| Disease | Disease Targets T/M/R/X | Eligible Candidates | Network-scorable | Reference eligible | Reference network-scorable |
|---|---|---:|---:|---:|---:|
| Multiple myeloma | 50/48/44/6 | 1,956 | 1,307 (66.82%) | 32 | 25 (78.125%) |
| COVID-19 | 50/49/41/9 | 1,956 | 1,307 (66.82%) | 1 | 0 (0%) |

The **same 649 unique Candidates** are unscorable in both cases, yielding 1,298 Disease–Candidate records. Every recorded reason is `no_retained_drug_targets`. The following disjoint conditions explain all 649:

| Source/network condition | Candidates |
|---|---:|
| No supplied gene Target IDs (`targets=[]`) | 557 |
| Nonempty supplied Target IDs, none in the full mapped graph | 16 |
| At least one Target in the full graph, none in its largest component | 76 |
| **Total** | **649** |

For the 92 Candidates with nonempty Target lists, their 114 excluded gene relationships comprise **16 `not_in_graph`** and **98 `outside_largest_component`**. Those are Target-relationship counts, not additional Candidate counts. No real-run Candidate has a zero-null-variance or insufficient-degree-pool failure, and neither Disease lacks retained Disease Targets.

The upstream unresolved-source entries attached to these Candidates also retain the following reasons. These are **source-item counts**; one Candidate may contribute several items across reasons, so they do not partition the 649 drugs:

| Upstream reason | Source items |
|---|---:|
| `missing_target_mapping` | 367 |
| `non_human_target` | 295 |
| `non_protein_target` | 316 |
| `non_single_protein_target` | 3 |
| `no_target_evidence` | 87 |
| `missing_parent` | 12 |
| `ambiguous_uniprot_mapping` | 13 |

The complete 649-Candidate roster, with IDs, names, coverage, condition and exact calculation reason, is saved in [not_scorable_candidates.csv](../../data/evaluation/stage3-audit/not_scorable_candidates.csv).

## Metric audit and unchanged results

[retrieval_metrics](../../core/ranking/evaluation.py:126) computes `|top K ∩ known ∩ universe| / |known ∩ universe|`. All in-scope positives contribute to the denominator, including positives with missing scores. Per-Disease reciprocal rank is `1 / rank` for the **first** retrieved positive, or zero if none is retrieved. MRR is the macro mean of those Disease-level values; it is not a mean over all positive drugs.

The verified policies are:

- **Multiple positives and duplicates:** references are sets; duplicate labels cannot inflate denominators. Duplicate ranked IDs are rejected. The existing multi-positive test retrieves 1/3 at 5 and 10, 2/3 at 20, and reciprocal rank 1/2.
- **Missing labels:** absent labels, empty positive sets and no positives in scope produce distinct status reasons and null metrics. Macro calculations list excluded Diseases explicitly rather than zero-filling them.
- **Unscorable Candidates:** the frozen full-universe policy is `unretrieved`. Missing network scores have no retrieved rank; eligible known Candidates remain in the denominator and contribute a miss. Direct-evidence selection still admits network-unscorable Candidates. The optional `append_by_id` policy is tested but was not used here.
- **Common subset:** all methods use the same intersection of four score-available sets, 1,307 Candidates. The seven unscorable myeloma positives and sole COVID-19 positive are explicitly recorded outside this subset. COVID-19 has no common-scope positive and is excluded with `no_positive_in_scope`; it does not contribute a zero to common-scope macro MRR.
- **Ties:** direct evidence sorts by descending score, descending breadth, then ChEMBL ID; shared count by descending count then ID; raw proximity by ascending distance then ID; z-score by ascending z, ascending raw distance, then ID. IDs use lexical ordering. Ties receive deterministic ordinal ranks, not averaged ranks or fractional Recall credit. Reversing input order leaves rankings unchanged.
- **Shortlist and random baseline:** shortlist Recall@15 uses the frozen, deduplicated Stage 2 shortlist, with no common-subset refill. The random baseline is one reproducible SHA256-keyed permutation with seed 0; common-scope evaluation filters the same permutation.

Existing tests cover all these cases ([test_evaluation.py](../../core/ranking/tests/test_evaluation.py:35)). Independent audit calculations rebuilt method orders from saved scores, recomputed metrics with rational arithmetic, and checked all 3,912 Candidate coverage/status records against source Target IDs and Stage 1 indexes. All matched.

**No corrected metrics:** the audited values below equal the original Stage 3 results. All Recall@5 and Recall@10 values are zero. Values are rounded for display; saved JSON/CSVs retain full precision.

| Method | Full Recall@20 | Full MRR (2 Diseases) | Common Recall@20 | Common MRR (myeloma only) |
|---|---:|---:|---:|---:|
| Direct Target evidence | 0 | 0.0212239583 | 0 | 0.0416666667 |
| Shared-Target count | 0.015625 | 0.0253906250 | 0.04 | 0.0500000000 |
| Raw proximity | 0 | 0.0032894737 | 0 | 0.0065789474 |
| Degree-matched z-score | 0 | 0.0200000000 | 0 | 0.0400000000 |
| Random, seed 0 | 0 | 0.0245480762 | 0.04 | 0.0714285714 |

The first myeloma reference is dexamethasone at direct rank 24, dexamethasone at shared-count rank 20, selinexor at raw-distance rank 152, panobinostat at z-score rank 25, and isatuximab at random rank 21. The first COVID-19 reference is remdesivir at direct/shared rank 1280 and random rank 677; it has no raw/z rank. Its tiny positive direct reciprocal rank reflects the zero-score tie-break, not positive Target evidence.

| Shortlist scope | Myeloma | COVID-19 |
|---|---|---|
| Full eligible | 0/32 = **0** | 0/1 = **0** |
| Common scorable | 0/25 = **0** | **null**, no positive in scope |

Full-universe z-score minus direct-evidence macro MRR is **−0.0012239583**; common-scope difference is **−0.0016666667**. This two-example smoke test provides no evidence of a general network advantage. Its incomplete labels, zero COVID-19 positive coverage in the common subset, single random permutation and two-case sample preclude a meaningful superiority claim. Missing labels also mean retrieved unlabelled drugs cannot automatically be called false positives.

## Provenance audit

The frozen manifest records declared Open Targets **26.09**, ChEMBL **37**, STRING **12.5** through the source/artifact chain; the exact two case IDs; input hashes and sizes; eligible-ID, ranking-order and shortlist hashes; the reference definition and limitations; Stage 2 settings and seed; and Stage 3 seed 0, 1,000 bootstrap samples and `unretrieved` policy. Stage 3 software versions are ranking **0.3.0**, Python **3.11.9**, NumPy **2.4.6**. Stage 1/2 software versions and graph filters are retained in their nested provenance.

The audit verified hashes against current files, including the original STRING gzip and mapping, all four saved graph/index/distance artifacts, both Stage 2 inputs/outputs, frozen references and the Stage 3 manifest. Original source files, Stage 1/2 artifacts and the nine frozen Stage 3 files remained unchanged. Key byte-level SHA256 values are:

| File | SHA256 |
|---|---|
| Stream A `drug_targets.json` | `5eeee1eab279a74ea4267dfd67c68f6e5fb55fe55023f1cb26b8ba46423a02b8` |
| Stream A `string_id_map.json` | `3fd65c202d7b56b6b4814ef03b313ba9d28fe4b8c3145f9f5567b065e8831a67` |
| Stream A myeloma Disease Targets | `134828f22cec629d791262529ac7399b29c3410216e5d683630279963cc0dbe3` |
| Stream A COVID-19 Disease Targets | `f85fc22a4947e3292eb0379d516af364da17f43560195ffe13cf2fe53f1325dc` |
| Stage 1 `manifest.json` | `985305db10abe9bc5da0a071c101a6aa1502ba6a396f84c55e7ac5ddf66f93b0` |
| Stage 2 myeloma ranking | `7e98057eb17d8e1a55364a3ea73ec6bcc34c4b5fb1b8e4997c63d37460b7c5df` |
| Stage 2 COVID-19 ranking | `9866d7f924831dbf8c8e696fe520fb949743efb101ed4ba0c06d132d942d2213` |
| Stage 3 frozen `references.json` | `e6941aa9c472df1b8a60ba1c329dc438f47e5df1126b94955939cc38c998fcfc` |
| Stage 3 `manifest.json` | `b4ab4074d352491842fa6cfb89021d79d4a5457013e6b8b69d90d9329cfa390a` |
| Stage 3 `results.json` | `9fb0ca091539a8676780d1b067954774cae16e1bc28a8500c81bf22c6723afa0` |
| Audit-only live Open Targets snapshot | `3965991cc790cf9d4c4745b1ccbf028bc3a94d76404e04884334bf40101e72d5` |

The Stage 3 **canonical JSON content hash** is `1b726faebbf30a65a3a43bbfdd952131dd1fa0b41341f112bb2f479b32a18e29`; it intentionally differs from the formatted manifest file's byte hash. Reference canonical content hash is `35cd43d576f094f09432110e8f8fe3d5fbf30b79a0ceed85f8030e008daeaf98`.

Explicitly missing or limited provenance:

- Original Stream A extraction timestamps, exact per-file download/query URLs, raw per-indication regulator report IDs/URLs, approval dates, withdrawals and a clinical label cutoff are **not present** in the frozen reference source. Aggregate provider names cannot fill these gaps.
- Original Stage 1 source-download URLs, extraction dates and license notices are explicitly absent in its source metadata; filename/release declarations and byte hashes are available. Hash verification proves file identity, not clinical completeness or independently verified upstream release identity.
- The Stage 3 manifest records package versions but **no source-code revision/hash** and no fully pinned environment lockfile. The currently uncommitted implementation is not represented as a committed reproducibility release.
- The separate live API snapshot records endpoint, exact query, HTTP status, response, retrieval UTC and file hash, but **no API release identifier**. Its response is corroborative, not a replacement frozen label release.
- The FDA label is identified by its official URL, revision and Reference ID above. A downloaded PDF byte hash is **not recorded**; it was inspected as an external audit source, not used as a frozen evaluation input.

## Validation, artifacts and next step

Commands run successfully:

```powershell
& '.\.venv-ranking\Scripts\python.exe' -m unittest discover -s ranking/tests -q
# Ran 52 tests in 0.545s: OK

& '.\.venv-ranking\Scripts\python.exe' -m ranking evaluate `
  --rankings data/ranking/stage2/MONDO_0009693.json data/ranking/stage2/MONDO_0100096.json `
  --indications data/stream_a/drug_targets.json `
  --output data/evaluation/stage3-audit-replay
# Same canonical manifest hash; all nine files byte-identical to stage3-smoke.
```

Supporting local artifacts, all under gitignored `data/`:

- [audit_checks.json](../../data/evaluation/stage3-audit/audit_checks.json): all reference diagnostic rows, independently checked metrics, first-positive ranks, reason counts and protected input/output hashes.
- [not_scorable_candidates.csv](../../data/evaluation/stage3-audit/not_scorable_candidates.csv): complete 649-Candidate roster.
- [open_targets_baricitinib_live.json](../../data/evaluation/stage3-audit/open_targets_baricitinib_live.json): separate query/response snapshot; 60,310 bytes.
- [replay_checks.json](../../data/evaluation/stage3-audit/replay_checks.json): all nine byte-hash comparisons against the fresh Stage 3 replay.

No code bug was found, so no algorithm correction or new regression test was needed. Existing edge-case tests and the independent real-data checks passed. No teammate pipeline, jury, frontend or docking file was modified.

Before expanding the scientific benchmark, define and freeze a **new, independently sourced, versioned reference release** with per-Disease indication provenance, clinical scope, cutoff and a declared Candidate-ID normalization policy. Keep this audited bundle unchanged, record label omissions such as baricitinib for that future curation process, and report network coverage alongside recovery metrics. Only two Disease input files exist; a ten-Disease research pilot remains incomplete. More cases alone will not repair incomplete labels.

The present result remains **retrospective known-relationship recovery**. Disease features declare `evidence_only` and exclude `clinical_precedence` and `cancer_biomarkers`; explicit treatment-label feature fields are rejected. Approval-source metadata defines the fixed eligible universe and indication IDs define evaluation positives, not proximity or evidence scores. Shared literature, target curation and network study bias can still encode relationships indirectly. Network proximity and retrieval metrics are not treatment-success probabilities.
