---
title: "Losing the pose's WebGL context blocks on the GPU, so it runs after the next step is drawn"
author: Abudi
date: 2026-10-25
branch: fixes
cost: { minutes: 17, tokens: 144470 }
id: l-895ede6d
scope: repo
status: active
replaces: l-f202591f
src: agent
touches:
  - web/src/three/poseScene.ts
---

## Decided
`PoseScene.dispose` (web/src/three/poseScene.ts) stops spin, disconnects observers and detaches the holder synchronously during the removal commit, then loses the WebGL context and calls `viewer.clear()` one frame plus a task later (rAF then setTimeout). Order inside stays: loseContext first, then clear, so clear never draws a final protein frame.

## Tried and ruled out
Removing the network's `<ViewTransition>` and reordering loseContext/clear did not fix CI: leaving Binding pose for History still stuck on "Binding pose" for >5 s on GitHub's Linux runners. A CPU profile (local Chromium at deviceScaleFactor 6 to make SwiftShader slow) showed ~1.4 s of self time in `WEBGL_lose_context.loseContext()` inside the layout-effect cleanup: it is a synchronous call that waits for the GPU process to drain queued spin frames, and the History commit waits with it. CDP CPU throttling does not reproduce it (it doesn't slow the GPU process); the amd64 Playwright Docker image under emulation is too slow to be representative.

## Watch out
The student pose e2e records the h1 text when the pose's context is lost and requires "History"; Compare's molecule contexts are lost earlier, so it checks only the last loss.
