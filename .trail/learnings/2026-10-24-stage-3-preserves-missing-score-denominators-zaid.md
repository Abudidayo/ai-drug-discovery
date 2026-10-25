---
title: Stage 3 preserves missing-score denominators and records a negative two-Disease smoke test
author: Zaid
date: 2026-10-24
branch: zaid/network-proximity
id: l-0bf9c4c2
scope: repo
status: active
src: agent
---

## Decided
- Stage 3 is evaluation-only: ranking.evaluation accepts fixed per-Disease method orders and separate references. The default full-universe missing-score policy is unretrieved: unavailable scores count as misses while eligible positives remain in the Recall denominator. The common subset intersects all four methods. No positives in scope means null metrics with an explicit macro exclusion. MRR uses the first positive per Disease, then macro averaging.
- ranking.evaluation_io freezes input/version/settings/seed hashes before metric computation and exports deterministic CSV/JSON/Markdown. Actual replay reproduced all nine files byte-for-byte. No Stage 1/2 scoring source or saved data was changed.
## Watch out
- Only two real Disease files exist. Stream A indication IDs yield 32 myeloma references (25 common-scorable) and only remdesivir for COVID-19 (not network-scorable). Do not inject baricitinib as an evaluation label. This is same-release retrospective recovery, not independent external/future validation. The ten-Disease pilot remains incomplete.
- The smoke test has zero shortlist Recall@15 for both full universes. Network z MRR is 0.020000 versus direct 0.021224. Negative findings remain recorded in ranking/STAGE3_RESULTS.md.
- Raw Stage 2 lacks four API fixture enrichment fields. ranking.integration adds them with explicit not_supplied status, preserves existing enrichment, and validates plan 9.2 Candidate fields. It does not invent citations or safety claims, or validate a nonexistent deployed API/full Experiment schema.
