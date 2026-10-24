---
name: ui-engineering-principles
description: "Use for frontend/UI work: building or refining interfaces, components, layouts, design systems, dashboards, forms, navigation, visual polish, state design, accessibility, responsive behavior, and frontend interaction quality. Applies alongside software-engineering-principles for UI code."
---

# UI Engineering Principles

Good UI engineering is not decoration. It is clarity, hierarchy, feedback, accessibility, performance, and helping users move through a product without confusion.

The best UI feels obvious. Users should not have to think about how to use the interface.

## Core principles

1. **Clarity over decoration** — Users should instantly know where they are, what the page does, what actions matter, and what happens next.
2. **Visual hierarchy is everything** — Guide attention through size, spacing, contrast, positioning, and typography weight. Primary action first; metadata last.
3. **Spacing creates quality** — Use consistent spacing scales. Avoid cramped layouts, random margins, and one-off values.
4. **Consistency beats creativity** — Buttons, radii, shadows, spacing, typography, interactions, and animations should feel like one system.
5. **Every element needs a purpose** — Remove visual noise that does not improve understanding, action, or feedback.
6. **Feedback must be immediate** — Design loading, hover, success, error, disabled, and pending states.
7. **State design matters more than static design** — Real UI includes loading, empty, error, success, retry, offline, partial data, permission, and edge states.
8. **Responsiveness is mandatory** — Adapt layouts properly. Consider stacking, touch targets, scroll behavior, mobile navigation, and readable density.
9. **Typography is a system** — Limit font sizes and weights; use proper line height, contrast, and content width.
10. **Components must be reusable** — Prefer reusable components with variants over duplicated one-off components.
11. **Design tokens matter** — Centralize colors, spacing, typography, shadows, and radii. Avoid hardcoded styling chaos.
12. **Motion should support understanding** — Animation should explain transitions, reinforce hierarchy, provide feedback, or guide attention. Avoid random motion and delays.
13. **Accessibility is real engineering** — Use semantic HTML, labels, keyboard navigation, focus states, contrast, and screen-reader-friendly patterns.
14. **UI performance is UX** — Avoid jank, lag, delayed rendering, stutters, unnecessary re-renders, oversized bundles, and unoptimized images.
15. **Avoid deep component trees** — Keep layout/component structures understandable and maintainable.
16. **Predictable interactions matter** — Buttons, modals, shortcuts, forms, menus, and navigation should behave consistently.
17. **Empty states matter** — Explain what is happening and what the user should do next.
18. **Error messages should be useful** — Tell users what failed and what they can do where possible.
19. **Do not overbuild early** — Avoid massive design systems, theme engines, and complex animation systems before they are justified.
20. **The best UI feels invisible** — The user should flow through the product without wrestling with the interface.

## UI implementation workflow

- Inspect the current UI/components before editing.
- Identify the intended product behavior and visual system before changing visuals.
- Fix root causes of inconsistency, not one-off visual hacks.
- Preserve existing functionality unless the objective requires changing it.
- Prefer reusable components, tokens, and patterns over local patches.
- Keep UI changes scoped, but fix adjacent inconsistencies when they materially affect the requested outcome.
- Validate visually with fresh screenshots/browser checks when practical.
- Run relevant frontend checks: lint, typecheck, tests, build, visual regression, or browser interaction checks.

## Practical checklist

Before considering UI work complete, check:

- Is the page purpose obvious?
- Is the primary action clear?
- Does the eye flow naturally?
- Are spacing, radius, typography, and controls consistent?
- Are loading/empty/error/success/disabled states handled?
- Are interactions predictable?
- Is keyboard/focus behavior acceptable?
- Does the UI remain usable at relevant viewport sizes?
- Is performance acceptable?
- Did the implementation reduce system chaos instead of adding another one-off pattern?
