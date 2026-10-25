---
title: "Open Targets 26.09 lists baricitinib and tocilizumab for COVID-19 only at Phase 3, not approval"
author: Jessica
date: 2026-10-25
branch: Jessica-mak/stream-a
cost: { minutes: 12, tokens: 31356 }
id: l-66cfe119
scope: repo
status: active
touches:
  - jury/client.py
  - pipeline/drugs.py
  - pipeline/experiment.py
  - pipeline/packets.py
  - tests/jury/data/covid_gpt_citations.json
  - tests/jury/test_client.py
  - tests/pipeline/data/covid_approvals.json
  - tests/pipeline/test_drugs.py
  - tests/pipeline/test_experiment.py
  - tests/pipeline/test_packets.py
---

## Decided
- data/drug_targets.json (pipeline/drugs.py) lists only remdesivir as regulator-approved for COVID-19 (MONDO_0100096). We don't add approvals by hand.

## Watch out
- In the pinned Open Targets 26.09 data, baricitinib's and tocilizumab's COVID-19 indications sit at PHASE_3 even though FDA approved both in 2022, and tocilizumab's EMA COVID entries have null disease IDs. Resolving child or obsolete disease IDs doesn't recover them. Any evaluation that treats COVID-19 approvals as labels has a single positive (remdesivir), and remdesivir isn't network-scorable.
- The COVID-19 → baricitinib known-answer check still works as an observation: baricitinib reached rank 4 in the end-to-end evidence shortlist (pipeline/experiment.py), without injection.
