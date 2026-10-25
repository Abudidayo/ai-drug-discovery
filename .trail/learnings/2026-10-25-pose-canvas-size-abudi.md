---
title: Pose canvas size
author: Abudi
date: 2026-10-25
cost: { minutes: 15, tokens: 64279 }
id: l-5ef9b4e0
scope: repo
status: active
src: agent
touches:
  - web/src/app/Figure.module.css
  - web/src/three/PoseViewer.tsx
  - "web/src/three/poseScene.ts#frame"
---

To reach about 1000x620 px at 1440x900 the pose panel runs past the figure grid's foot beside Back and Next (negative margin-bottom built from --footer-gap and --control-height in Figure.module.css), because the page chrome (header, title and intro, footer) leaves only about 560 px otherwise; this only works while the side column is wider than the two buttons, so keep its clamp minimum at 300 px or more. The controls bar overlays the canvas top on desktop, and frame() gets the covered height as an inset and keeps as much clear at the bottom, so the drug stays at the canvas centre, which is also the spin pivot. Short windows (max-height 820) widen the side column to 340 px so the caveat stays visible without scrolling.
