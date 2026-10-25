---
title: Network-path explanations enrich saved shortlists without changing scoring
author: Zaid
date: 2026-10-25
scope: repo
status: active
touches:
  - ranking/paths.py
  - ranking/tests/test_paths.py
  - ranking/NETWORK_PATHS.md
---

## Decided

- Use `python -m ranking.paths --artifacts ... --input ... --output NEW_DIRECTORY` to enrich existing Stage 2 or Stage 3 API rankings. Core scoring, integration and evaluation modules remain unchanged. Existing files are never overwritten.
- Each shortlisted Candidate gains optional `network_paths` schema version 1. Keep one deterministic shortest path for every retained drug Target in `all_paths.json`; expose at most three representatives in Candidate JSON. Select first, lower median and last after sorting by hops, drug Target ID, Disease Target ID and full path. Contributor counts refer to all Targets, not the three displayed paths.
- Choose the nearest retained Disease Target by distance then Ensembl ID. Walk the lexicographically smallest neighboring ID whose saved distance to that endpoint decreases by one. Check every graph edge, nearest matrix distance, hop count and the aggregate saved mean. Direct overlaps are singleton zero-hop paths. Do not average the unreachable sentinel.
- Output `ranking.json`, packet-assembly `shortlist.json`, complete `all_paths.json` and a provenance/timing manifest. Input fields, ranks, z-scores, shortlist membership and original outputs are preserved. Existing Candidate adapter/validator accepts the extension; original and enriched Stage 3 evaluation cases are equal.

## Watch out

- Full graph and LCC distance-matrix indexes differ. Keep separate identifier maps. Reject retained-Target claims inconsistent with the saved scoring component or graph hashes.
- The CSR graph contains binary edges, not original edge evidence records. Label explanations `derived_from_pinned_filtered_STRING_graph`, STRING 12.5, combined score >=700 and direct experiments >=400; `edge_level_citations=not_retained`. Paths are network associations, not proven mechanisms or causal routes. They explain observed distance; they do not replace conditional-null normalization.
- The shortlist file retains original Candidate fields for Jessica's packet assembly; existing evidence enrichment/blinding still controls the surrounding jury payload. No Jessica pipeline or jury code was modified.
- All 80 tests pass. The real examples under ignored `data/ranking/network-paths-v1/` contain 341 paths for 15 myeloma Candidates and 106 for 15 COVID-19 Candidates. Independent graph BFS verified all 447, output replays are byte-identical, and original benchmark/source checksums still pass. Total export overhead was 0.5816s and 0.5538s; path reconstruction/validation was 0.1472s and 0.1324s.
- Real examples: myeloma sunitinib (`CHEMBL535`) has 67 contributing Targets and unchanged mean 1.7313432835820894. COVID-19 baricitinib (`CHEMBL2105759`) has six paths with hop sum 9, unchanged mean 1.5, direct rank 4 and network rank 29. Complete paths and the actual JSON extension are documented in `ranking/NETWORK_PATHS.md`.
