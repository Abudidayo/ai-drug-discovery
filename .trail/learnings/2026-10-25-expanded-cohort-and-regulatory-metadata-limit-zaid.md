---
title: Expanded 16-case cohort is reproducible but approval metadata is not clinical ground truth
author: Zaid
date: 2026-10-25
scope: repo
status: active
touches:
  - ranking/cohort.py
  - ranking/cohort_protocol.json
  - ranking/cohort_report.py
  - ranking/COHORT_RESULTS.md
---

## Decided

- `ranking.cohort` collects and seals a predeclared 16-Disease, eight-area panel using unmodified Jessica pipeline code pinned at `181f4ac755512cc4c42654c8a35b1468a13bb4af`. It reuses the existing Stage 2/3 algorithms. The complete ignored bundle is `data/evaluation/cohort-ot26.09-v1/`; original COVID/myeloma smoke outputs are preserved.
- Real release 26.09 schemas: `clinical_indication` has `clinicalReportIds`, `drugId`, `diseaseId`, `maxClinicalStage`; linked `clinical_report` records have nested `drugs`, `diseases`, source/stage/type/URL. Require exact pair membership, approval-stage regulatory indication records, URLs, and no linked regulatory withdrawal. Variant mapping requires unique Stream A ownership plus an API-verified parent.
- 534 qualifying original indication records normalize to 487 source-reference pairs, 393 unique Candidates. All 16 cases pass coverage criteria; no execution failures. Reference network coverage is 427/487 (87.68%); Candidate coverage remains 1307/1956 (66.82%). Main run took 83.475 seconds.
- All 68 tests pass. Offline replay reconstructs all 16 feature files and accepted/rejected labels, nine evaluation files reproduce byte-for-byte, and one full ranking reproduces except timestamp/runtime fields. All three raw Parquet files match published single-part S3 ETags. Freeze SHA256 is `f042df1f6b080faa797b611c385c10e1c71c94c2b4957648eef551f04083f66d`.

## Watch out

- Regulatory provenance is insufficient to establish clinical indication truth. The exact DailyMed record `c34f77a7-996b-4470-b5df-d946a7fe5dbe` is tagged as trientine hydrochloride / rheumatoid arthritis / APPROVAL in Open Targets, while its cited label explicitly advises against rheumatoid arthritis use. The post-ranking audit archives this contradiction without changing sealed labels or metrics. Treat the current benchmark as source-record recovery; a clinically vetted approved-treatment benchmark needs a newly versioned, source-text-adjudicated reference set.
- `non_human_target` in supplied Stream A unmapped records does not always mean a pathogen. Penicillamine and trientine reference Copper (`CHEMBL2363057`, Target type METAL, null organism); azithromycin references bacterial 70S ribosome (`CHEMBL2363135`). Interpret mechanism scope using entity type, not organism-nullness alone. Detailed interpretation flags are separate from the frozen inputs.
- Full-universe Recall@20 / MRR: direct evidence 0.172430 / 0.430422; shared Targets 0.131938 / 0.317655; raw proximity 0.188572 / 0.550303; degree-matched z 0.120497 / 0.308355; random 0.006750 / 0.032732. Do not claim the z-score improves this cohort. Do not infer clinical effectiveness or prospective performance from source recovery.
- The legacy Stage 3 Markdown template has a hardcoded two-example caveat. The new cohort report supplies the actual 16-case interpretation without modifying that frozen evaluator/template. The environment lock was captured after input sealing but before ranking, and its hash is in diagnostics.
