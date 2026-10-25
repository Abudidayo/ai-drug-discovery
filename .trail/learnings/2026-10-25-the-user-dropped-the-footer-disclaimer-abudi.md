---
title: "The user dropped the footer disclaimer and the 'not safe' note, and moved Evidence before Saved experiments"
author: Abudi
date: 2026-10-25
cost: { minutes: 20, tokens: 143927 }
id: l-e4f8a181
scope: repo
status: active
src: agent
touches:
  - api/oxhack_api/services/live_jury.py
  - api/oxhack_api/stream_a.py
  - api/tests/test_jury.py
  - jury/client.py
  - tests/jury/test_client.py
  - api/openapi.json
  - api/oxhack_api/fixtures/MONDO_0100096/experiment.json
  - api/oxhack_api/repo/postgres.py
  - api/oxhack_api/schemas.py
  - api/oxhack_api/services/ranking.py
---

## Decided
- On 25 Oct the user asked to remove the footer disclaimer ("For learning only. ... Not medical advice.") and the evidence step's "No label warnings are recorded. That doesn't mean the drug is safe." box. They called the box bloat. `copy.disclaimer` and `copy.evidence.noWarnings` are gone, and `WarningBox` in web/src/steps/EvidenceStep.tsx renders nothing when a drug has no warnings.
- Evidence is now step 7, just before Saved experiments, in `copy.steps` (web/src/copy/en.ts). The user felt it sat in the middle of the main path. Next from Candidate drugs goes to Model jury.
- docs/design.md principles 1 and 5 were updated to match.

## Watch out
- plan.md §2 still lists Evidence as step 4, and plan.md still has a "Required disclaimer" paragraph. Don't add either back from those; the user chose against them.
- The protein network stays mounted (hidden) on non-network steps. The e2e specs now reach Evidence through its nav link, not Next, and reach Saved experiments from the pose step the same way.
- Compare's "None recorded" warning cell (`copy.compare.noWarnings`) was kept on purpose: it fills a table cell and makes no safety claim.
