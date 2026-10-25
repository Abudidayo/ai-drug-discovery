---
title: Official 14-Disease inputs executed with original seal; RWR interval includes zero
author: Zaid
date: 2026-10-25
scope: repo
status: active
touches:
  - ranking/shortlist_comparison.py
  - ranking/SHORTLIST_HANDOFF.md
---

## Decided

- Executed the unchanged comparison in Zaid's original Windows .venv-ranking environment. Sandbox access initially prevented the Windows Store Python launcher from starting; running outside the sandbox verified the original seal successfully. No environment repair, code change or new seal was made. Original implementation hash remains a58bad6a56b692ef64164d19d1a974915bd03d929af410be2ae9fa9efad04647; Jessica's implementation.local.json was never used as a seal.
- Official inputs were downloaded from Jessica-mak/stream-a commit 2d9f63ba967eb4da70ba7e6e688f918fa4ba3d70. All 22 manifest-listed bundle checksums and 14 preregistered Target checksums passed. Newly downloaded stream-a-data-v1 drug_targets.json matched bf133936221f124ec77877fdfb8a23dc26dd1b14aeb11735ee71540668cd7d24. Inputs and results are separate under ignored data/evaluation/official-shortlist-14-2026-10-25-v1/; SUMMARY.md has exact invocation/provenance/output links.
- All 14 Diseases evaluated against the same 1956 eligible Candidates and 293 references. Z-score retrieved 11 pairs, macro Recall@15 0.0505015331, micro 0.0375426621. Physical RWR retrieved 15, macro 0.0688822188, micro 0.0511945392. Paired macro difference +0.0183806856, 95% bootstrap interval [-0.0060650927, 0.0439657530]; RWR wins/losses/ties 4/2/8. Both hit at least one reference in 8/14 Diseases. Do not claim established RWR superiority.

## Watch out

- The published README explicitly classifies this full-universe comparison as descriptive retrospective source-record recovery, separate from the preregistered fixed-panel jury analysis. A2 regulator metadata is aggregated per drug; individual indication approval is not independently established. Do not call this clinical validation or the confirmatory jury analysis.
- EFO_0803536 is named "multiple sclerosis symptom measurement" in the frozen Target input, while the protocol intended multiple sclerosis. It was kept unchanged. Flag this ontology/naming discrepancy rather than silently replacing the ID.
- Jessica's exported graph inventory differs in four byte hashes (graph, index, mapping exclusions, manifest) from the explicitly requested original local graph. Distances.npy is identical. Local graph checksums and prior freezes passed; no topology-equivalence claim or artifact substitution was made.
- Both methods score 1307/1956 Candidates per Disease. Reference coverage is 229/293; all 64 unavailable reference pairs have no_retained_drug_targets and remain misses in denominators. No missing labels or ineligible reference Candidates. Detailed coverage and reasons are in analysis/reference_coverage.csv and analysis/unscorable_reference_pairs.csv.
- Run completed in 82.115s evaluator time (83.436s wall); all 14 RWR solves converged in 58–60 iterations. All 28 shortlists have 15 unique IDs; 49 output checksums passed. The old 16-case bundle, 459 protected RWR external files and 65 previous result files verified unchanged. No jury, app default, ranking source or settings changed.
