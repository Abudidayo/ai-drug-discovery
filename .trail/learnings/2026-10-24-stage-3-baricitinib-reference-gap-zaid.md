---
title: Stage 3 baricitinib discrepancy is a frozen reference gap
author: Zaid
date: 2026-10-24
scope: repo
status: active
touches:
  - ranking/STAGE3_AUDIT.md
  - ranking/references.py
  - ranking/evaluation.py
---

## Decided

- Keep the frozen Stage 3 labels and results unchanged. The audit found no code bug; all 52 tests pass and nine fresh replay files match byte-for-byte. Full diagnostics are in `ranking/STAGE3_AUDIT.md`.
- Before expanding the benchmark, freeze a new independent, versioned indication reference release with per-Disease regulatory provenance and a clinical cutoff. Do not insert known-answer examples into the existing bundle.

## Watch out

- COVID-19 baricitinib (`CHEMBL2105759`) is eligible and scorable (7/6/6/1 Target coverage), direct rank 4, z-score rank 29 and shortlist position 14. It is absent from the frozen source's `approval.disease_ids`, which contains only `MONDO_0004980`, `MONDO_0008383` and `MONDO_0011429`. No normalization collision was found.
- The sole frozen COVID-19 positive is remdesivir (`CHEMBL4065616`), with no supplied human Target IDs and no shortlist membership. Thus full shortlist Recall@15 is correctly 0/1; common-scope COVID metrics are null with `no_positive_in_scope`, not zero performance. This does not show baricitinib was missed.
- A separately saved live Open Targets query on 2026-10-24 reports the exact baricitinib/COVID pair as `PHASE_3` with 22 trial-only reports. The FDA label (June 2026, Reference ID 5826077) includes the adult COVID indication. This corroborates a source-curation gap; the live snapshot lacks a release identifier and is not a historical 26.09 replay.
- The same 649 unique Candidates are unscorable in both Diseases, all `no_retained_drug_targets`: 557 have no supplied Targets, 16 have none in the full graph, 76 have mapped Targets but none in the largest component. None is a zero-variance/null-pool failure in these runs.
- Reference providers are aggregated per drug; they do not establish approval provenance for each indication. Missing labels are unlabelled relationships, not evidence of ineffectiveness. Interpret this as retrospective known-relationship recovery, not treatment-success probability or prospective prediction.
