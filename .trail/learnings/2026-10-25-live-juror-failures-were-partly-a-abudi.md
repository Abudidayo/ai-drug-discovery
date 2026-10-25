---
title: "Live juror failures were partly a number-check bug: hyphenated names like IL-12 read as -12"
author: Abudi
date: 2026-10-25
branch: abdullah-nextverse/workstream-c-jury
cost: { minutes: 17, tokens: 144735 }
id: l-d7fb0725
scope: repo
status: active
src: agent
touches:
  - web/src/charts/DotPlot.tsx
  - web/src/charts/dotPlotLayout.test.ts
  - web/src/charts/dotPlotLayout.ts
  - jury/client.py
  - tests/jury/test_client.py
  - api/README.md
  - api/oxhack_api/app.py
  - api/oxhack_api/services/live_jury.py
  - api/tests/test_jury.py
  - web/src/copy/en.ts
---

## Decided
- jury/client.py `_name_identifiers` now adds the hyphenated spelling of every known letters-then-digits name (IL12 -> IL-12, JAK1 -> JAK-1), excluding labels and evidence IDs (C12, E12). Kimi K3's recorded ulcerative colitis reply failed only on "IL-12 and IL-23" read as -12 and -23; it passes now. Unknown names (JAK-99, dose-99) stay checked.
- GPT-5.4's other failures are real rule breaks, kept: listing its own evidence IDs in prose ("missing from E178, E179") without citing them, and quoting pChEMBL values from evidence it did not cite. build_prompt states both rules.
- Every live jury now writes stream A's whole result to data/experiments/<id>/jury_result.json (api/oxhack_api/services/live_jury.py, audit_dir), including the last raw reply of a failed juror. Read that before guessing why a juror failed.

## Watch out
- Before the fix, 2 of 3 live diseases (psoriasis, ulcerative colitis, 25 Oct) ended with no consensus; 4 of 9 juror reviews needed a retry and 4 were invalid. After it, a new psoriasis run had all three valid on the first attempt. One run is not a rate: check more diseases before calling the jury reliable.
- Each Experiment gets one jury review (services/experiments.py ask_jury); a failed review cannot be retried without a new Experiment. Changing that is a product decision.
- The bake-off's raw replies (results/juror_bakeoff/results.json) need data/juror_bakeoff/ packets to re-validate; they are not in the repo.
