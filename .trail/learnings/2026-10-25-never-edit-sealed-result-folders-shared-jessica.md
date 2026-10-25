---
title: Never edit sealed result folders; shared input bundles use real files and repo-relative paths
author: Jessica
date: 2026-10-25
branch: Jessica-mak/stream-a
cost: { minutes: 14, tokens: 26802 }
id: l-84a9ea83
scope: repo
status: active
touches:
  - pipeline/disease_targets.py
  - results/shortlist_comparison_inputs/README.md
  - results/shortlist_comparison_inputs/manifest.json
  - results/shortlist_comparison_inputs/validate_inputs.py
  - tests/pipeline/test_disease_targets.py
  - jury/client.py
  - jury/pilot.py
  - pipeline/a6.py
---

## Decided
- results/experiment_b/, results/experiment_b_replication/, results/jury_pilot/ and results/a6*/ are sealed records whose hashes prove nothing changed after freezing. Their machine paths are historical, so leave them. Fix paths only in code and in unsealed bundles such as results/shortlist_comparison_inputs/.
- Paths in code and handoff bundles are repo-relative or configurable (arguments or environment variables). The final review caught hard-coded /Users/... paths in jury/pilot.py and pipeline/panels.py that let a protocol freeze silently record zero scorer hashes on another machine.

## Watch out
- Zaid runs Windows (PowerShell). Don't put symlinks in shared bundles; copy the file instead. Git symlinks can become plain text files on Windows checkouts.
