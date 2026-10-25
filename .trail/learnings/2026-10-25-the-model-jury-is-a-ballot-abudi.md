---
title: The Model jury is a ballot board; the dot plot is gone
author: Abudi
date: 2026-10-25
cost: { minutes: 90, tokens: 10698 }
id: l-9ed77df4
scope: repo
status: active
src: agent
touches:
  - web/src/steps/JuryStep.tsx
  - web/src/lib/jury.ts
  - web/e2e/steps-5-8.spec.ts
  - docs/design.md
---

## Decided
- The user picked the "Ballot board" prototype (variant A) for the Model jury step over the dot plot, a rank-flow chart and case files. `JuryResult` in web/src/steps/JuryStep.tsx now draws a real `<table>`: consensus place, drug, one tile per counted model (its rank, styled by decision: filled Investigate, outlined Watch, light Set aside), and the rank spread; picking a row fills the reading pane (verdict, then each model's call, rationale and objection). DotPlot, dotPlotLayout, `featuredObjection` and `copy.jury.contestedNote` were deleted with it.
- Kept beyond the prototype screenshot, on purpose: a "Split decision" key entry whenever a row is contested (the orange bar needs a meaning; Compare uses the same words) and the agreement note under the board (docs/design.md principle 5 asks for it).

## Watch out
- Each drug is a `<button>` whose `::after` covers its row, so Playwright reports the button as intercepting clicks on any other cell. Click the row locator (`getByTestId("jury-row-…").click()`), not a cell, and never compute a click position from `boundingBox()` right after the result appears: the panels are still hinging in, so the box is wider than the settled row.
- The board handles ArrowUp/ArrowDown itself (roving tab stop) and calls `preventDefault`, which is what stops `useStepKeys` from changing step.
