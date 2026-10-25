---
title: Selected website and legacy app fixtures have separate scientific meanings
author: Jessica
date: 2026-10-25
branch: Jessica-mak/half-life-ui
cost: { minutes: 75, tokens: 742463 }
id: l-9055ac75
scope: repo
status: active
touches:
  - plan.md
  - jury/pilot.py
  - results/juror_bakeoff/protocol.md
  - results/juror_bakeoff/protocol_frozen.json
  - results/juror_bakeoff/results.json
  - results/juror_bakeoff/summary.md
  - tests/jury/test_juror_bakeoff.py
  - ranking/SHORTLIST_HANDOFF.md
  - ranking/tests/test_application_shortlist.py
  - workstream_b/application_shortlist.py
---

## Decided
The selected Half Life website uses the prototype entry and fixture-backed scaffold imported from workstream-c commit 598013f. Include the required web scaffold, API demo fixtures, assets and setup instructions when committing the website so it runs independently of a backend. TechnicalOverview.tsx describes the current physical-RWR workflow and selected GPT-5.4 / GLM-5.3 / Kimi K3 jury independently of the archived fixture's fictional ranks and older juror names. Exact archived evidence remains explicitly labelled.

## Tried and ruled out
A repository-wide lexical consistency check flags the newly imported fixture records and documentation as reintroducing old behavior. Those records are demonstration data, not production Open Targets API code, current candidate eligibility rules, current RWR measurements or current model configuration. Do not alter archived evidence or relabel old fixture ranks to silence those matches. Retain the source provenance and explicit limitations instead.

## Watch out
The selected Technical view is a single page with fixed text and no chapter navigation or lab backdrop. Five chapters belong only to Story. Keep transparent header/footer/control groups. PRODUCT.md and web/README.md now describe the selected website rather than the earlier unchosen prototype round. .context remains excluded from commits.
