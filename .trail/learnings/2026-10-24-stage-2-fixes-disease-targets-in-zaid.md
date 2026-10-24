---
title: Stage 2 fixes Disease Targets in the conditional null and ranks the full approved universe
author: Zaid
date: 2026-10-24
branch: zaid/network-proximity
id: l-05fc4ca6
scope: repo
status: active
src: agent
touches:
  - plan.md
---

## Decided
- Stage 2 implements `ranking.scoring.rank_files` and `RankingEngine` against saved Stage 1 artifacts, with no graph rebuild. The explicit Stage 2 instruction supersedes the earlier both-sets randomisation: `plan.md` 4.3 now specifies the conditional null with Disease Targets fixed and only drug Targets sampled.
- Jessica's actual relationship schemas are documented in `ranking/STAGE2.md`: drug rows use drug_id/approval.sources/targets/unmapped; Disease rows use target_id/evidence_only_score and rule exclusions. Select the top 50 unique Disease Targets before LCC filtering. Full release eligibility is regulator provenance, not a known link to the selected Disease.
- Null pools are LCC degree bins of at least 100 proteins; match retained Target count and bin counts without replacement within each draw. Use 200 draws, population SD, explicit PCG64 and a SHA-256-derived seed per configured seed/Disease/degree-count profile. Identical profiles share reference samples; input reordering and unrelated Candidates cannot change their scores.
- Keep raw distance with distance_only and null z for zero spread or insufficient pools. No retained Disease/drug Targets yields not_scorable/network=null. Network ordering is ascending z/raw distance/ChEMBL ID, followed by distance-only results; positive direct evidence can shortlist network-unscorable Candidates.
## Watch out
- Current Disease files already contain only 50 scores. The direct-evidence and shared-Target baselines are limited to supplied associations; absent support does not establish a biological zero. Stream A unmapped items include mechanisms and non-protein entities, so report them separately from unique-protein coverage.
- Real runs each rank all 1,956 approved Candidates, with 1,307 finite z-scores, 649 without retained drug Targets, and 15 unique shortlisted Candidates. Disease LCC coverage is 44/50 for myeloma and 41/50 for COVID-19. Zero-variance and insufficient-pool cases were absent in these runs, but are tested. Detailed scores/provenance are in ignored data/ranking/stage2 and ranking/STAGE2_RESULTS.md.
- The ranking output is an integration payload, not a complete blinded jury packet. Stream A must enrich citations/safety; strip ranks, scores and selection reasons and shuffle the shortlist before juror review. Do not interpret z as a treatment probability.
