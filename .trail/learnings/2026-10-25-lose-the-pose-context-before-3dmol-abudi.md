---
title: Lose the pose context before 3Dmol clear to avoid redraws during navigation
author: Abudi
date: 2026-10-25
branch: fixes
id: l-f202591f
scope: repo
status: active
src: agent
touches:
  - web/src/three/poseScene.ts
  - web/src/three/PoseViewer.tsx
  - web/src/app/NetworkPanel.tsx
  - web/e2e/steps-5-8.spec.ts
---

3Dmol GLViewer.clear calls removeAllSurfaces, which draws the still-loaded protein, then draws again after model removal. Calling clear before losing its context makes unmount wait for those GPU renders. With passive cleanup, the new History heading can appear before disposal; with layout cleanup, the commit itself waits. PoseScene.dispose must stop animation and observers, detach the holder, lose the existing WebGL context, and only then clear models. Renderer.render returns early for a lost context, so JavaScript model cleanup remains without a final protein draw. The browser regression spies on the actual viewer.clear and verifies the context is already lost at entry. Keep PoseViewer lifecycle cleanup synchronous in useLayoutEffect. Separately, a hidden NetworkPanel should use ViewTransition default=none: native page capture is unnecessary there and can stall navigation even though the network itself is hidden; retain the wrapper so the persistent network is not remounted.
