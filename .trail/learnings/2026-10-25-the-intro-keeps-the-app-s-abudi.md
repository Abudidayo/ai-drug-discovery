---
title: "The intro keeps the app's white editorial look; Jessica's art is borrowed into it, in her indigo-violet palette"
author: Abudi
date: 2026-10-25
branch: abdullah-nextverse/drug-discovery-demo-intro
cost: { minutes: 13, tokens: 97277 }
id: l-44cdeccb
scope: repo
status: active
src: agent
touches:
  - web/index.html
  - web/public/favicon.svg
  - web/src/app/BrandMark.tsx
  - web/src/app/ExperimentStatus.tsx
  - web/src/app/PageFrame.module.css
  - web/src/app/PageFrame.tsx
  - web/src/app/PrototypeSwitcher.module.css
  - web/src/app/PrototypeSwitcher.tsx
  - web/src/app/Shell.test.tsx
  - web/src/app/experiment.test.tsx
---

## Decided
On 25 Oct the user chose intro variant 1 ("Scientific editorial", web/src/app/routes/IntroPage*) as the homepage at `/`. Step 1 moved to `/explore`. Jessica's Half Life site (branch Jessica-mak/half-life-ui) supplies parts that sit inside the app's white page: the animated lab plate (web/src/intro/LaboratoryScene.tsx), crops of her story illustrations, tape stickers, and her Workflow map (web/src/intro/WorkflowMap.tsx). The map's colours are remapped through local custom properties on its root to the illustrations' indigo, violet and lavender. Amber is kept only for the disease. The page's background blooms use the same purple family.

## Tried and ruled out
- A dark, full-bleed homepage built in Jessica's own presentation (three variants). The user wants their own layout with her elements, not her design.
- Stretching the lab plate to fill the hero's height. It turned the plate square. Keep it 16:10 and centre it vertically between the top of the headline and the foot of "Start exploring".

## Watch out
The user removed the "Fig. 0" and "Fig. 1" captions, the chapter name beside the lab's 1-4 buttons, and the 10+ years / 90% statistics block. Don't bring them back.
