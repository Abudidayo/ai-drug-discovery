---
title: Workflow root tokens need higher specificity than r2 defaults
author: Jessica
date: 2026-10-25
branch: Jessica-mak/website-design-exploration
cost: { minutes: 30, tokens: 39060 }
id: l-64677f66
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
web/src/prototypes/round-three/Workflow.tsx is shared by Keynote.tsx and web/src/prototypes/workflow-review.tsx. The component and WorkflowDetails.tsx replace the old review.js controller. workflow.css scopes all review styles.

## Tried and ruled out
A single .half-life-workflow root selector tied with .r2 in base.css. Import order allowed the white/green base tokens to win, making the technical page white and header lettering nearly invisible. workflow.css uses .r2.half-life-workflow for root tokens and colors, and descendant-scoped rules elsewhere. Do not restore the old global :root/body review stylesheet.

## Watch out
model.ts pauses the obsolete four-step tour. The replacement has five chapters and persists tab/view/stage URL parameters. Keep archived statement and model wording exact, and distinguish approved still artwork from narrative animation. Verify both main and review entry points in the built artifact.
