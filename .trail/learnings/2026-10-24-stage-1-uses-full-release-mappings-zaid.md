---
title: Stage 1 uses full release mappings and separate graph versus distance indexes
author: Zaid
date: 2026-10-24
branch: main
id: l-abdc5c30
scope: repo
status: active
src: agent
---

## Decided
- Stage 1 lives in `ranking/`. The real Stream A mapping is `data/stream_a/string_id_map.json` with root `releases`, `coverage`, `mappings`; rows use `string_id`, `target_id`, `status`, `reason`. Identical source rows deduplicate; conflicting genes/statuses quarantine a STRING protein. Many proteins mapping to one gene are valid and their edges merge.
- `data/string/9606.protein.physical.links.full.v12.5.txt.gz` has separate `experiments` and `experiments_transferred` columns. Require combined_score >= 700 and direct experiments >= 400; transferred-only support cannot pass the direct threshold.
- Keep all mapped genes in the sparse full graph for coverage, including isolates. Compute production distances only on its LCC. `index.json` distinguishes `graph_gene_ids` from `distance_gene_ids`; mixing these row orders silently corrupts later proximity calculations.
- `ranking.artifacts.load_artifacts` verifies hashes and reloads the distance matrix read-only without source files. `uint8` sentinel 255 is unreachable; overflow is checked before casting and uint16 is available. Failed CLI builds publish no bundle.
## Watch out
- The measured c700/e400 graph has 19,199 mapped genes, 113,969 undirected edges and 5,979 isolates; the LCC has 12,834 genes and 113,713 edges. Its distance table has max 13 hops and no unreachable pairs. Real artifacts are under ignored `data/ranking/string-12.5-c700-e400/`; detailed counts, timings and hashes are in the manifest and `ranking/STAGE1_RESULTS.md`.
- `fixtures/README.md` was not present, and the supplied inputs had no original download URL/date/licence manifest. The implementation records missing metadata explicitly.
- This machine's Python is the Microsoft Store 3.11 runtime; the local `.venv-ranking` works for tests/builds outside the execution sandbox but its base runtime is inaccessible inside it.
