---
title: Result steps unmount the network while the Experiment is still building
author: Abudi
date: 2026-10-25
branch: fix-network-persist-flake
cost: { minutes: 1, tokens: 1107 }
id: l-f4903b12
scope: repo
status: active
src: agent
touches:
  - web/src/app/routes/ExperimentLayout.tsx
  - web/e2e/steps-1-4.spec.ts
---

## Watch out
In `web/src/app/routes/ExperimentLayout.tsx`, a RESULT_STEPS step (candidates, evidence, jury, compare, pose) whose Experiment isn't ready renders `BuildProgress` in place of the whole `FigureGrid`, so `NetworkPanel` unmounts and the 3D network is rebuilt when the build finishes. Only biology keeps it, via `early`. E2E tests that tag the network to check it persists must first wait for the Experiment's `status` to be `ready` (`web/e2e/steps-1-4.spec.ts`), because slower CI runners reach Candidate drugs mid-build and the test then flakes.
