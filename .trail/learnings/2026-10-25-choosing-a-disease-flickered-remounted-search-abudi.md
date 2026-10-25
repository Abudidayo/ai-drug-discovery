---
title: "Choosing a disease flickered: remounted search, uncached Experiment, deferred network"
author: Abudi
date: 2026-10-25
cost: { minutes: 70, tokens: 13086 }
id: l-b164bb5a
scope: repo
status: active
src: agent
touches:
  - web/src/steps/DiseaseSearch.tsx
  - web/src/app/routes/StepFigure.tsx
  - web/src/api/queries.ts
  - web/src/three/NetworkFigure.tsx
  - web/src/three/plate.ts
  - web/src/app/Legend.module.css
  - web/src/app/experiment.test.tsx
---

## Decided
- The user saw step 1 "lag, then reload the same list" on every disease click. Measured in Chromium against the live API (frame log of element identities per rAF, 25 Oct): three causes. (1) `StepFigure` rendered `<DiseaseSearch key={experiment?.id}>`, so the search panel remounted on every switch and its 820 ms `hinge` entry animation (Figure.module.css, `backwards` fill, 120 ms delay) replayed: the list vanished and swung up again. (2) `useOpenDisease` returned a reused Experiment's ID without fetching it, so the new screen first rendered with no Experiment: the key went undefined then the ID (two remounts), the box emptied and `NetworkPanel` unmounted for ~330 ms. (3) Router updates are React transitions and `NetworkPanel` sits in a `<ViewTransition>`, so React starts a view transition on every switch and runs passive effects only after it ends: `NetworkFigure` built the new scene ~400 ms after the list already marked the new disease.
- Fixes: no key; `DiseaseSearch` syncs the box from `current.disease.name` during render (stored previous name), so list, scroll and focus stay. `useOpenDisease` puts a reused Experiment in the cache (`queryClient.query({ ..., staleTime: "static" })`, which replaces the deprecated `ensureQueryData`) before navigating. The navigation runs in the search's own `useTransition`, so `aria-busy` stays on the chosen row until its screen commits (no frame with the old mark back). `NetworkFigure` creates the scene in `useLayoutEffect` and draws once synchronously (`Plate.draw`), so the view transition's new snapshot already holds the new network.
- The network legend sits under the plate, right-aligned (`justify-content: flex-end` in Legend.module.css), on every network step and width; in flow, so it never covers nodes or labels.

## Tried and ruled out
- Leaving scene creation in `useEffect`: the view transition defers it; switching to `useLayoutEffect` without the synchronous draw would snapshot a blank canvas (size comes from a ResizeObserver, first render on the next rAF).

## Watch out
- In tests the router's pathname changes before the new screen commits (transition), so wait for the rendered state (e.g. the mark), not the URL, before asserting on the screen.
