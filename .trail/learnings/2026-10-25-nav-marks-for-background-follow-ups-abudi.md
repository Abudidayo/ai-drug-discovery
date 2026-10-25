---
title: Nav marks for background follow-ups
author: Abudi
date: 2026-10-25
cost: { minutes: 16, tokens: 67282 }
id: l-21963e57
scope: repo
status: active
src: agent
touches:
  - web/src/app/Shell.tsx
  - web/src/app/Shell.module.css
  - web/src/app/ExperimentStatus.module.css
---

The step nav shows the jury's and the binding poses' background state (lib/followUps.ts) with a mark before the label that is ALWAYS rendered on those two steps (idle = quiet edge-grey ring), so no state change can move the header. Rejected: a reserved-but-empty slot (uneven nav gaps whenever there is nothing to wait for, e.g. no dockable drug), a dot under the label (looked like a stray artifact; no room in the 48px narrow nav), and putting the state in the link's name (e2e matches nav links with exact names), so the state is an aria-describedby on a hidden span plus a polite aria-live notice (not role=status: step tests query the single status role). Chrome floors a 1.5px border to 1px while inset:-1.5px is not floored, so a turning-gap ::after offset by the border sat 1px off-centre and vanished when still; draw the ring and the gap as two same-size layers (inset:0) instead. A long Disease name now ellipsizes so the nav (flex:none) never overflows at 1101-1360px.
