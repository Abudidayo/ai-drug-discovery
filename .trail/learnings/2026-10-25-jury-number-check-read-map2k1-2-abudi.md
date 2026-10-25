---
title: Jury number check read MAP2K1/2 as MAP2K1 plus the number 2
author: Abudi
date: 2026-10-25
cost: { minutes: 5, tokens: 38951 }
id: l-2fc9521e
scope: repo
status: active
src: agent
touches:
  - docs/design.md
  - web/README.md
  - web/e2e/steps-1-4.spec.ts
  - web/e2e/steps-5-8.spec.ts
  - web/src/app/PageFrame.module.css
  - web/src/app/PageFrame.tsx
  - web/src/app/Shell.test.tsx
  - web/src/app/experiment.test.tsx
  - web/src/app/networkView.ts
  - web/src/app/routes/EvaluationPage.test.tsx
---

## Decided
- `jury/client.py` `_numbers`: a slashed family list may now have a prefix that contains digits, as long as it ends in a letter. "MAP2K1/2" is MAP2K1 and MAP2K2, and it's exempt only when every expanded name is a Target in the packet ("MAP2K1/9" is still rejected).
- Found on the codespace deploy (25 Oct, plasma cell myeloma, jury-v7): Kimi K3's second attempt failed only on "MAP2K1/2" for mirdametinib. With the fix its saved reply passes, and with GLM-5.3 that is two valid jurors, so the run would have reached a consensus.

## Watch out
- GPT-5.4's failure in the same run was a genuine rule break and stays rejected: it quoted LYN's 9.17 from evidence it didn't cite.
- To re-check a failed jury, run `validate_reply` on `jurors[].raw_output` in `data/experiments/<id>/jury_result.json` against that folder's `evidence_packet.json`.
