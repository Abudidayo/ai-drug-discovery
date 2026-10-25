---
title: "Wiring stream B's network ranking into live mode"
author: Abudi
date: 2026-10-25
branch: abdullah-nextverse/workstream-c
cost: { minutes: 47, tokens: 348271 }
id: l-fb5681d5
scope: repo
status: active
src: agent
touches:
  - api/oxhack_api/services/ranking.py
  - api/oxhack_api/services/live.py
  - api/oxhack_api/services/plain.py
  - api/oxhack_api/stream_b.py
  - api/oxhack_api/prepare.py
  - web/src/lib/candidates.ts
---

## Decided
- `NetworkRanking` (api/oxhack_api/services/ranking.py) ranks each Disease once with Zaid's `RankingEngine` (about 5 s) and caches the result. When live.py drops a shortlisted drug (not its own ChEMBL parent, or approval unconfirmed), `stream_b.rerank` reassigns ranks and the shortlist with Zaid's own `assign_ranks` and `make_shortlist` on the remaining drugs. This is valid because his scores of a drug don't depend on the other drugs: each degree profile gets its own seeded draws.
- Stream B gets every association score, not only A1's top 50, because its direct-evidence baseline uses all supplied scores. It still picks the top 50 itself, by (-score, ENSG), which matches A1. The adapter raises if the two selections ever differ.
- Zaid's `direct_evidence_rank` also ranks drugs with zero direct support (ties at 0 broken by ChEMBL ID, e.g. thalidomide at 519). The adapter sends null ("Not ranked") unless `direct_evidence.status == "supported"`.
- prepare builds the mapping with Jessica's `build_mapping` over the existing `data/ot/target` parts. `string_map.download_sources` would download the target table again, into `ot/26.09/target`, and use whatever STRING version is current; prepare pins 12.5. The whole bundle builds in about 20 s on an M-series Mac, not minutes, and matches Zaid's STAGE1 counts exactly.

## Watch out
- A pathway evidence item is one record shared by every Candidate with a Target in that pathway (one E ID per Experiment). Its `summary` therefore can't name a drug's own target. A per-drug summary made `BuildResult` fail with "evidence E173 differs between Candidates". `plain.pathway` names the disease proteins in the pathway instead. Network-path items are keyed by the exact route, so they can name its proteins.
- The Evidence step's network panel already describes `network.path` in words. The `network_path` item for that same route is filtered out of the facts (`listedEvidence`, web/src/lib/candidates.ts), so the route is said once. For that to match, the API sets `path` to stream B's first representative route.
