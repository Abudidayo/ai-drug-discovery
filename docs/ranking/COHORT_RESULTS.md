# Expanded Open Targets 26.09 benchmark

Measured 25 October 2026 for Zaid. **Retrospective known-relationship recovery**, not prospective prediction or treatment-success probability.

Completed **16 additional Diseases**, 8 therapeutic areas, **487 distinct Disease–Candidate source-reference pairs** (393 unique Candidates), from 534 original indication records meeting the frozen metadata rule. All reference pairs are eligible in the fixed Candidate universe. No collection or ranking execution failed. **A targeted source check found a confirmed label contradiction; these are source-record recovery metrics, not a validated approved-treatment benchmark.**

Each method uses the same **1,956** approved Candidates per Disease. **1,307/1,956 (66.82%)** have valid raw and z-scores; 649 remain explicitly unscorable per Disease. Reference network coverage is **427/487 (87.68%)**. All 16 Diseases have positives in the common subset.

## Selection and freezing

The tracked `ranking/cohort_protocol.json` predeclares 16 established-condition names across rheumatology, dermatology, respiratory, gastroenterology, metabolic, cardiovascular, oncology and neurology. This is a purposive convenience panel, not a random epidemiological sample. Unique exact canonical names take precedence over exact synonyms in the pinned Disease table. No ranks, z-scores or recovery metrics determine inclusion, and failed cases are not replaced.

Inclusion requires at least 25 positive evidence-only Target scores among the top 50, at least 20 top-50 Targets in the largest network component, and at least one eligible reference Candidate with a supplied human mechanism Target. All 16 passed; excluded cases: **none**. Hypertension resolves through an exact synonym to hypertensive disorder; Hypercholesterolemia uses the release's HP identifier. COVID-19 and multiple myeloma remain separate smoke tests and are absent from this cohort.

Inputs, case decisions, labels, source tables, API responses, pipeline snapshot and scorer/evaluator source hashes were sealed **before any cohort ranking** at `2026-10-25T00:08:09.770669+00:00`. Freeze SHA256: `f042df1f6b080faa797b611c385c10e1c71c94c2b4957648eef551f04083f66d`. The original smoke-test and Stage 2 outputs are protected by the seal and passed verification after evaluation.

## Actual cases

Targets are retained/50; references are eligible/common-scorable. Shortlist recall uses every eligible reference in the denominator.

| Disease | Open Targets ID | Targets | References | Shortlist Recall@15 |
|---|---|---:|---:|---:|
| rheumatoid arthritis | MONDO_0008383 | 42/50 | 57/51 | 5/57 = 0.0877 |
| psoriasis | MONDO_0005083 | 45/50 | 33/28 | 3/33 = 0.0909 |
| atopic eczema | MONDO_0004980 | 43/50 | 34/34 | 3/34 = 0.0882 |
| asthma | MONDO_0004979 | 45/50 | 49/44 | 3/49 = 0.0612 |
| chronic obstructive pulmonary disease | MONDO_0005002 | 43/50 | 15/12 | 0/15 = 0.0000 |
| ulcerative colitis | MONDO_0005101 | 43/50 | 25/23 | 0/25 = 0.0000 |
| Crohn disease | MONDO_0005011 | 45/50 | 16/16 | 4/16 = 0.2500 |
| type 2 diabetes mellitus | MONDO_0005148 | 37/50 | 53/47 | 7/53 = 0.1321 |
| Hypercholesterolemia | HP_0003124 | 37/50 | 22/15 | 11/22 = 0.5000 |
| osteoporosis | MONDO_0005298 | 36/50 | 19/11 | 3/19 = 0.1579 |
| hypertensive disorder | MONDO_0005044 | 40/50 | 68/67 | 1/68 = 0.0147 |
| breast carcinoma | MONDO_0004989 | 45/50 | 28/22 | 2/28 = 0.0714 |
| prostate carcinoma | MONDO_0005159 | 43/50 | 13/7 | 2/13 = 0.1538 |
| Parkinson disease | MONDO_0005180 | 44/50 | 18/16 | 0/18 = 0.0000 |
| Alzheimer disease | MONDO_0004975 | 49/50 | 15/14 | 6/15 = 0.4000 |
| epilepsy | MONDO_0005027 | 40/50 | 22/20 | 6/22 = 0.2727 |

## full_eligible

Macro means across all 16 Diseases; missing full-universe scores are `unretrieved` and remain misses. Common-scope evaluation uses the same 1,307-Candidate intersection for every method.

| Method | Recall@5 | Recall@10 | Recall@20 | MRR |
|---|---:|---:|---:|---:|
| direct_evidence | 0.078587 | 0.128152 | 0.172430 | 0.430422 |
| shared_targets | 0.037241 | 0.071285 | 0.131938 | 0.317655 |
| raw_proximity | 0.048589 | 0.105148 | 0.188572 | 0.550303 |
| degree_matched_z | 0.039364 | 0.073739 | 0.120497 | 0.308355 |
| random | 0.000000 | 0.003017 | 0.006750 | 0.032732 |

Paired z-score minus direct evidence: Δ Recall@20 **-0.051933**, Δ MRR **-0.122067**. Their bootstrap 95% intervals are `[-0.09362089508643184, -0.008946645958643092]` and `[-0.2754648065833228, 0.011806695677169238]`. The unchanged degree-matched method does not improve these cohort macro metrics over direct evidence.

## common_scorable

Macro means across all 16 Diseases; missing full-universe scores are `unretrieved` and remain misses. Common-scope evaluation uses the same 1,307-Candidate intersection for every method.

| Method | Recall@5 | Recall@10 | Recall@20 | MRR |
|---|---:|---:|---:|---:|
| direct_evidence | 0.096112 | 0.159279 | 0.210184 | 0.430535 |
| shared_targets | 0.049054 | 0.099331 | 0.161797 | 0.318636 |
| raw_proximity | 0.066915 | 0.135148 | 0.232425 | 0.550303 |
| degree_matched_z | 0.050643 | 0.098907 | 0.156976 | 0.308355 |
| random | 0.000000 | 0.004070 | 0.007134 | 0.037831 |

Paired z-score minus direct evidence: Δ Recall@20 **-0.053208**, Δ MRR **-0.122179**. Their bootstrap 95% intervals are `[-0.10303787270902327, -0.0011757981977632667]` and `[-0.27546762020877297, 0.011806695677169238]`. The unchanged degree-matched method does not improve these cohort macro metrics over direct evidence.

## Label provenance and suitability

Labels were extracted independently of scoring and Stream A's aggregate `approval.disease_ids`, from complete release-pinned `clinical_indication` and `clinical_report` Parquet tables. The exact `clinicalReportIds` join requires matching original drug and Disease membership, indication and report approval stage, report type `INDICATION`, a recognized regulator source (FDA, EMA Human Drugs, PMDA, DailyMed), and a source URL. A linked regulator withdrawal rejects the pair. Trials, TTD claims and stage alone do not qualify. All report IDs, URLs, years (including null), provider/type, source-release information and original drug variants are retained in the reference diagnostics.

Rejected source indication records: `{'indication_not_approval': 3477, 'no_exact_pair_regulatory_approval_report_with_url': 265, 'regulator_withdrawal': 63}`. No linked report is missing. All 534 accepted original records map to eligible Candidates: exact IDs or a uniquely owned Stream A variant whose Open Targets parent was verified with release-checked API responses. Parent mapping deduplicates labels to 487 Disease–Candidate pairs; it does not alter the scorer's Candidate universe or Target data.

Frozen source mechanism flags across distinct reference pairs: `{'human_mechanism_supplied': 443, 'nonprotein_mechanism_without_human_mechanism': 8, 'mechanism_or_mapping_unresolved': 24, 'human_bioactivity_only_primary_mechanism_unresolved': 9, 'nonhuman_mechanism_without_human_mechanism': 3}`. These describe supplied evidence, not an independently adjudicated primary mechanism for every clinical use. A subsequent ChEMBL 37 Target-entity check yields `{'human_mechanism_supplied': 443, 'nonprotein_mechanism_without_human_mechanism': 8, 'mechanism_or_mapping_unresolved': 24, 'human_bioactivity_only_primary_mechanism_unresolved': 9, 'nonhuman_organism_target_in_supplied_mechanism': 1, 'nonprotein_metal_entity_in_supplied_mechanism': 2}`. In particular, `non_human_target` does not necessarily mean a pathogen: Copper (`CHEMBL2363057`) has Target type `METAL` and null organism. Penicillamine and trientine reference that entity. Azithromycin references bacterial 70S ribosome (`CHEMBL2363135`, organism Bacteria). The three affected references have no network score and remain visible in the frozen full-universe results:

- MONDO_0005002: **AZITHROMYCIN** (`CHEMBL529`), nonhuman_organism_target_in_supplied_mechanism; supplied gene Target count 0, retained 0.
- MONDO_0008383: **PENICILLAMINE** (`CHEMBL1430`), nonprotein_metal_entity_in_supplied_mechanism; supplied gene Target count 0, retained 0.
- MONDO_0008383: **TRIENTINE** (`CHEMBL609`), nonprotein_metal_entity_in_supplied_mechanism; supplied gene Target count 0, retained 0.

The human STRING graph cannot represent pathogen-only or nonprotein therapeutic mechanisms. Bioactivity against human proteins alone does not prove a drug's primary therapeutic mechanism acts through them. The full-universe metrics retain these limitations; the common subset measures a different, coverage-conditioned population. The entity audit is interpretation-only and did not alter frozen labels, feature inputs, selection or metrics.

## Confirmed source-label contradiction

The frozen trientine–rheumatoid arthritis pair (`CHEMBL609`, `MONDO_0008383`, original salt `CHEMBL3989777`) passes every metadata filter: Open Targets links a DailyMed approval-stage indication record with matching IDs and a real URL. However, that very [SYPRINE label, updated September 2020](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=c34f77a7-996b-4470-b5df-d946a7fe5dbe) indicates Wilson disease in penicillamine-intolerant patients and explicitly advises against rheumatoid arthritis use. The source metadata therefore contains at least one false positive relative to its cited regulatory text.

This was found in a targeted mechanism/source review after ranking, not a random quality sample; it does not estimate the overall error rate. The label page, retrieval metadata and hashes are archived separately in `mechanism_audit/`, and `label_validation_flags.csv` identifies the contradiction. **No post-result label removal or metric repair was made.** All reported metrics retain the exact frozen 487-pair source-reference set. A clinically vetted approved-treatment reference set remains blocked on source-text adjudication and a newly versioned label release; the metadata-only collector cannot establish clinical indication validity. Do not describe these 487 pairs as 487 confirmed approved treatments.

## Reproducibility, outputs and limitations

The offline replay reconstructed all **16 Disease Target files**, **534 label records** and all rejected records identically, without network requests. All **9 evaluation files** replayed byte-for-byte with reversed ranking-input order. Re-running the first frozen case (`HP_0003124`) reproduced every ranking field except the three explicitly volatile timestamp/runtime fields. Source/artifact/code checksums and original smoke-test checksums passed.

Measured run time: **83.475 seconds**, including **77.356 seconds** in 16 Stage 2 calls. Ranking failures: **0**. There are **10384** unscorable Disease–Candidate records, all `no_retained_drug_targets`; no zero-variance or insufficient-pool failure occurred. These are the same 649 unique Candidates per Disease. Pipeline code is unmodified at commit `181f4ac755512cc4c42654c8a35b1468a13bb4af`; its full-association rescoring validates default API scores before selecting top-50 `evidence_only` Targets. All API snapshots assert data release 26.09. Optional collection dependencies are DuckDB 2.0.0 and HTTPX 0.28.1; the full environment lock and its hash are recorded in diagnostics (the lock was captured after input sealing, before ranking).

Outputs under `data/evaluation/cohort-ot26.09-v1/`: `freeze.json`, `protocol.json`, `sources.json`, `cohort.json`/`cases.csv`, `references.json`, `relationships.json`/`.csv`, `label_exclusions.json`/`.csv`, `variant_checks.json`, archived raw Parquet/API files, `targets/`, `rankings/`, `evaluation/` (CSV/JSON/Markdown, intervals and paired comparisons), `run.json`/`timings.csv`, `diagnostics.json`, `reference_diagnostics.csv`, `not_scored.csv`, `label_validation_flags.csv`, `mechanism_audit/` and `evaluation-replay/`. All data and generated artifacts are gitignored. `reference_diagnostics.csv` lists every known Candidate, provenance, coverage, four baseline ranks, shortlist membership and interpretation flags. `not_scored.csv` lists every missing network calculation.

Source versions and byte hashes for all three Parquet datasets are in `sources.json` and diagnostics. Pinned downloads: [Open Targets 26.09 Disease table](https://open-targets-public-data-releases.s3.eu-west-1.amazonaws.com/platform/26.09/output/disease/00000000.parquet), [clinical indications](https://open-targets-public-data-releases.s3.eu-west-1.amazonaws.com/platform/26.09/output/clinical_indication/00000000.parquet), [clinical reports](https://open-targets-public-data-releases.s3.eu-west-1.amazonaws.com/platform/26.09/output/clinical_report/00000000.parquet). Dataset definitions are documented on the [official downloads page](https://platform.opentargets.org/downloads).

Approval histories in these source records are not a fresh jurisdiction-specific adjudication of current authorization or clinical benefit. Some source years are null; release 26.09 is the data cutoff, not an inferred approval date. Source URLs are preserved, but their pages were not independently re-curated one by one. Missing relationships remain unlabelled, not ineffective drugs. Current Candidate IDs can represent related formulations; metrics count Candidate IDs, not clinical regimens.

The features exclude direct clinical-precedence and cancer-biomarker channels and treatment labels do not enter scoring. Residual indirect leakage through literature, target curation and network study bias remains possible because labels and features share Open Targets/ChEMBL sources. Related Diseases also share drugs and Targets. This is a 16-case retrospective convenience pilot; bootstrap intervals and one seeded random permutation do not establish clinical generalization. Raw proximity has stronger MRR here than the z-score, while direct evidence has stronger early recall than the z-score; no algorithm was adjusted after seeing these results. The generic Stage 3 report retains a legacy two-example caveat from the earlier smoke-test template; this cohort report supplies the correct case count and interpretation.
