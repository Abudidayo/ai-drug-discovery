---
title: SEGESTA references research animation rather than a mountain visual identity
author: Jessica
date: 2026-10-25
branch: Jessica-mak/segesta-website-prototypes
cost: { minutes: 26, tokens: 44407 }
id: l-08863706
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
The user clarified that the SEGESTA Dribbble link is an animation and storytelling reference, not a request for its mountain/city visual identity. In web/src/prototypes/segesta/Horizon.tsx the focus is a researcher at a microscope, because their attached picture supplies the subject: researchers investigating possible compounds. Specimen.tsx and Relay.tsx explore different identities, while preserving project facts and all three tabs. web/prototypes/segesta/index.html is an isolated entry because this working tree already contains concurrent website explorations.

## Tried and ruled out
A low-poly biological landscape was generated before the clarification. It is not referenced or shipped because unrelated scenery misses the intended researcher story. The stock microscope image is only a reference; the shipped artwork is an original generation rather than an edit of its watermark.

## Watch out
Treat the whole single-page site as the prototype unit. Do not overwrite earlier rounds' pickers or production entries. Keep the fixture ranks labelled as fictional legacy proximity, separate from the current RWR policy in ranking/SHORTLIST_HANDOFF.md. Trail's tracked-file validator cannot recognise the new prototype files until the imported web tree is committed; this note names real local files intentionally.
