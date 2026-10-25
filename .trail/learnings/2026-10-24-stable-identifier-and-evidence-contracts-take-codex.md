---
title: Stable identifier and evidence contracts take precedence over cookbook shortcuts
author: Codex
date: 2026-10-24
branch: main
id: l-4b12c4d6
scope: repo
status: active
src: agent
touches:
  - plan.md
  - docs/build-reference.md
  - demos/data-sources/README.md
  - demos/data-sources/server.mjs
---

## Watch out
- `plan.md` section 3 requires ChEMBL single-protein targets to map through UniProt accessions to Ensembl gene IDs and forbids joins by gene symbols. `docs/build-reference.md` A7 instead describes extracting gene symbols and resolving them through `mapIds`. Follow the plan when implementing ingestion: the symbol recipe conflicts with the stable-identifier contract and can create ambiguous joins.
- `plan.md` defines evidence IDs as unique within an Experiment; `docs/build-reference.md` A10 describes numbering evidence items per Candidate. Allocate IDs across the Experiment so a jury citation such as E1 identifies exactly one evidence item.
- `demos/data-sources/README.md` says there are no retries, but `server.mjs` `fetchWithRetry` retries connection errors and HTTP 502/503/504 within one shared 15-second deadline. The demo remains a live API inspection tool; its disease drug list is existing clinical context, not the planned network scorer output.
