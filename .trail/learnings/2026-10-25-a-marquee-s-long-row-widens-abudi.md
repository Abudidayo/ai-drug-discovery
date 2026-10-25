---
title: "A marquee's long row widens the whole PageFrame unless it has contain: inline-size"
author: Abudi
date: 2026-10-25
branch: abdullah-nextverse/drug-discovery-demo-intro
cost: { minutes: 26, tokens: 448828 }
id: l-a2c1e626
scope: repo
status: active
src: agent
touches:
  - web/src/intro/playback.ts
  - web/src/intro/LaboratoryScene.tsx
  - web/src/intro/MonitorStory.tsx
  - web/src/intro/laboratory.module.css
  - web/src/intro/content.ts
  - web/src/styles/tokens.css
  - web/src/intro/Brand.tsx
  - web/src/intro/StoryParts.tsx
  - web/src/intro/story.module.css
  - web/src/intro/Constellation.tsx
---

## Watch out
In web/src/intro/showpieces.module.css, `.marquee` (the "Built on" sources strip in intro variant 4) needs `contain: inline-size`. Without it, `overflow: hidden` and `min-width: 0` are not enough: the row's min-content width still counts towards the PageFrame grid column, so the header, main and every section grew to about 2565px and the page scrolled sideways.

## Decided
The intro borrows Jessica's lab (web/src/intro/LaboratoryScene.tsx) inside the app's white layout instead of her dark site. The user rejected a dark Half Life homepage and wants their own intro variants with her elements added. Her story illustrations have headlines baked in at the left, so web/src/intro/content.ts crops them with background zoom and position to keep that lettering out.
