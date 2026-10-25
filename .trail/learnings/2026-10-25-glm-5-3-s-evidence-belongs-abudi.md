---
title: "GLM-5.3's 'evidence belongs to another Candidate' failures are the model's, not the packet's"
author: Abudi
date: 2026-10-25
branch: abdullah-nextverse/workstream-c-jury
cost: { minutes: 14, tokens: 276152 }
id: l-29484741
scope: repo
status: active
src: agent
touches:
  - api/oxhack_api/services/live_jury.py
  - api/oxhack_api/stream_a.py
  - api/tests/test_jury.py
  - jury/client.py
  - tests/jury/test_client.py
  - web/src/steps/JuryStep.module.css
  - plan.md
  - results/juror_bakeoff/summary.md
---

## Decided
- Live rheumatoid arthritis run (25 Oct, jury-v7, GPT-5.4 + GLM-5.3 + Kimi K3): GLM-5.3 was invalid after 2 attempts, every error "Cn: evidence belongs to another Candidate" (jury/client.py validate_reply). The API's rebuilt packet (api/oxhack_api/services/live_jury.py jury_packet) was byte-equal to the stored data/experiments/<id>/evidence_packet.json, so the packet was not the cause: GLM cites evidence IDs that are listed under a different drug.
- Left the validator and prompt alone: the jury configuration is frozen (plan.md), and the bake-off (results/juror_bakeoff/summary.md) already recorded GLM failing the same citation check. The run still forms a consensus from the two valid jurors (minimum two), and the UI says GLM has no votes.

## Watch out
- The packet invites this mistake: 12 statements appear under several evidence IDs (e.g. "Open Targets 26.09 records a regulator-backed approval from FDA." under 7 IDs, without naming the drug). Making those statements name their drug would be a jury-v8 change, decided on pilot Diseases only.
- The API keeps no invalid juror's raw reply (map_juror drops raw_output); to see what GLM actually wrote, call run_jury directly on the stored packet.
