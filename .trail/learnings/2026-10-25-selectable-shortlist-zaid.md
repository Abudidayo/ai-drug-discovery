---
title: Opt-in physical RWR shortlist preserves the legacy default and seals comparison before labels
author: Zaid
date: 2026-10-25
scope: repo
status: active
touches:
  - ranking/shortlist.py
  - ranking/shortlist_comparison.py
  - ranking/shortlist_examples.py
  - ranking/tests/test_shortlist.py
  - ranking/SHORTLIST_HANDOFF.md
---

## Decided

- Keep the old scorer and every existing source/result unchanged. `ShortlistSettings` defaults to zscore; physical_rwr is an explicit opt-in. A separate ranking view reuses unchanged `make_shortlist`: initial 10 network + 5 positive evidence; mark initial overlaps both; refill unique slots from supported evidence then valid network. Shortages and unavailable-score reasons are explicit.
- `select_shortlist` returns `oxhack.shortlist.v1` with method, graph manifest/version, configuration/seed, eligible-universe hash, coverage and per-entry rank/lane/reasons. `project_shortlist` deep-copies a ranking, archives original selection fields, and changes selection fields only. Existing z/raw/functional RWR scores and paths remain untouched. Original Candidate status is still proximity status, not RWR status.
- New comparison CLI has separate seal/verify/compare commands. The seal takes no case list or labels and hashes every ranking module/settings/dependency version. Compare requires a supplied published protocol and 14-case list, pins input bytes/eligible IDs, computes both shortlist sets, freezes them, then parses labels. It never collects a substitute cohort. Pure metrics cover all eligible references, missing labels, multiple positives, fractional Recall@15 and any-hit, macro/micro counts and paired Disease-bootstrap intervals/wins/losses/ties.
- Local implementation seal: `data/evaluation/shortlist-comparison-v1/implementation.json`, implementation hash `a58bad6a56b692ef64164d19d1a974915bd03d929af410be2ae9fa9efad04647`. Official replication remains unrun pending Jessica's protocol/list/Targets/references. Protocol content must be reviewed against sealed settings before label access; the code records the document hash, not publication verification.

## Watch out

- All 113 ranking tests pass (93 existing plus 20 new), including synthetic end-to-end 14-case ingestion that asserts both shortlist sets exist before parsing labels. The original 16-case bundle, prior RWR freeze's 459 protected external files and 65 recorded outputs verified unchanged.
- Real integration examples only: `data/ranking/shortlist-methods-v1/integration-examples/{MONDO_0009693,MONDO_0100096}/`. Both methods select 15 unique IDs; zscore exactly matches old selections. Both have 1307/1956 network scorable, with 30/26 positive evidence Candidates. Myeloma/COVID shortlist overlaps across methods are 7/6. Generation took 2.874/2.399s; no graph rebuilt, COVID reused existing RWR.
- Existing network_paths are proximity explanations, not RWR explanations. Only old selected Candidates had path enrichment: 7/6 new physical-RWR selected Candidates carry existing paths; new members need a separate proximity-path bundle if wanted. Do not fabricate paths or re-label diffusion as shortest paths. The examples preserve original complete-path files and all original path objects.
- All generated assets stay under ignored data/. Default app/jury behavior is unchanged until the team explicitly uses the opt-in projection.
