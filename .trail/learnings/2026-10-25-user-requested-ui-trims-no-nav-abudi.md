---
title: "User-requested UI trims: no nav marks, no scroll bars, renamed steps"
author: Abudi
date: 2026-10-25
cost: { minutes: 24, tokens: 61559 }
id: l-fb251291
scope: repo
status: active
replaces: l-21963e57
src: agent
touches:
  - web/src/styles/tokens.css
  - web/src/app/Shell.tsx
  - web/src/steps/DiseaseSearch.tsx
  - web/src/steps/PoseStep.tsx
  - web/src/lib/docking.ts
  - web/src/copy/en.ts
---

The user asked to remove the jury/pose progress marks in the step nav (lib/followUps.ts is gone; the ring-centring fix in ExperimentStatus.module.css and the header's Disease ellipsis stay), the build line under step 1's common diseases (the network appearing is the feedback; BiologyTargets still uses BuildLine), and the Binding pose step's 'Not available yet' list (lib/docking.ts now only has dockingPairs/structureFor; when nothing can be docked the step shows one line, copy.pose.noneDockable, without naming drugs). Steps renamed: 'Its biology' -> 'Disease proteins', 'Saved experiments' -> 'History'; URL slugs biology and history unchanged on purpose (saved links, tests). Scroll bars are hidden once, globally, by 'body * { scrollbar-width: none }' plus ::-webkit-scrollbar in tokens.css (the page's root scroll bar stays). The cue in their place is a shared global class .scroll-fade in tokens.css that each scrolling panel pulls in with 'composes: scroll-fade from global;' (works in Vite dev and build): a bottom mask whose depth is a registered @property animated by animation-timeline: scroll(self), so it shows only while more is below and never on a panel that fits (an inactive timeline leaves the 0px initial value). It still works under the reduced-motion reset. The pose column's old always-on mask plus padding-bottom was replaced by it.
