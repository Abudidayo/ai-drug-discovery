---
title: Concurrent prototype rounds need separate entry points
author: Jessica
date: 2026-10-25
branch: Jessica-mak/website-design-exploration
cost: { minutes: 26, tokens: 44407 }
id: l-c6d31457
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
Keep `PrototypePicker` in `web/src/prototypes/round-two/main.tsx` behind its own HTML entry at `web/prototypes/round-two/index.html`, because concurrent rounds can rewrite `web/src/prototypes/main.tsx`. Give each round its own build configuration and browser checks, while sharing only data and small functional helpers.

## Tried and ruled out
Reusing the global picker collided with another active round editing that entry. A backup taken during concurrent edits did not identify the previous design set reliably. An explicit new picker and separate entry preserved the other work. Early edits to the root verification scripts were restored from known pre-round snapshots; round-two checks now live in `web/prototypes/round-two/verify.mjs` and `web/prototypes/round-two/motion-check.mjs`.

## Watch out
Verify the explicit /prototypes/round-two/ URL and data-design marker before capturing screenshots, because a healthy Vite root URL may show another round. Import `web/src/prototypes/round-two/base.css` before variant CSS, because same-specificity defaults otherwise override variant tokens and flatten the palette. Untracked prototypes do not appear in a normal git diff, so scoped builds and rendered checks are the validation evidence. These paths exist and pass the code index coverage check; Trail note's tracked-file validator rejects them only because the imported web tree has not been committed.
