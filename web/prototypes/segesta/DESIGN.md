---
name: "SEGESTA comparison — PROVISIONAL"
description: "Three unselected local prototype worlds; no production visual identity is approved."
colors:
  horizon-ground: "#21182a"
  horizon-paper: "#2b2235"
  horizon-ink: "#f7f0ee"
  horizon-muted: "#bdb0c5"
  horizon-rule: "#493c53"
  horizon-soft: "#352b40"
  horizon-accent: "#d2e8d7"
  horizon-accent-ink: "#263c34"
  horizon-disease: "#dba192"
  horizon-tertiary: "#b2a8df"
  horizon-network-rule: "#c5b2cf"
  horizon-network-node: "#ab94b7"
  specimen-ground: "#f6f5ee"
  specimen-paper: "#fbfaf4"
  specimen-ink: "#293c31"
  specimen-muted: "#637061"
  specimen-rule: "#d1d5c4"
  specimen-soft: "#e9ecd9"
  specimen-accent: "#3d6350"
  specimen-accent-ink: "#faf8e9"
  specimen-disease: "#af6551"
  specimen-tertiary: "#827449"
  specimen-network-rule: "#6d8760"
  specimen-network-node: "#78936b"
  relay-ground: "#fcfbf8"
  relay-paper: "#fff"
  relay-ink: "#242e35"
  relay-muted: "#626d73"
  relay-rule: "#dbe0dd"
  relay-soft: "#f0f2ed"
  relay-accent: "#ac4236"
  relay-accent-ink: "#fff9f1"
  relay-disease: "#c99137"
  relay-tertiary: "#397a7a"
  relay-network-node: "#7c9390"
  relay-network-rule: "#7c9390"
  specimen-plate: "#eeedcd"
  relay-rail: "#29343a"
  relay-ticket: "#fffdf7"
typography:
  horizon-display:
    fontFamily: "Scene Sora, sans-serif"
    fontSize: "clamp(52px, 5.2vw, 80px)"
    fontWeight: 400
    lineHeight: 1.16
    letterSpacing: "-0.04em"
  specimen-display:
    fontFamily: "Scene Newsreader, Georgia, serif"
    fontSize: "clamp(61px, 6.7vw, 96px)"
    fontWeight: 350
    lineHeight: 1
    letterSpacing: "-0.035em"
  relay-display:
    fontFamily: "Scene DM Sans, sans-serif"
    fontSize: "clamp(48px, 4.6vw, 71px)"
    fontWeight: 550
    lineHeight: 1.04
    letterSpacing: "-0.04em"
  interface-body:
    fontFamily: "Instrument Sans Variable, sans-serif"
    fontSize: "15px"
    lineHeight: 1.6
  specimen-body:
    fontFamily: "Scene DM Sans, sans-serif"
    fontSize: "15px"
    lineHeight: 1.6
  motion-label:
    fontFamily: "Instrument Sans Variable, sans-serif"
    fontSize: "11px"
    lineHeight: 1.4
  horizon-results-title:
    fontFamily: "Scene Sora, sans-serif"
    fontSize: "26px"
    lineHeight: 1.4
    fontWeight: 400
  specimen-results-title:
    fontFamily: "Scene Newsreader, serif"
    fontSize: "30px"
    fontWeight: 400
  relay-results-title:
    fontFamily: "Scene DM Sans, sans-serif"
    fontSize: "21px"
    lineHeight: 1.3
    fontWeight: 500
    letterSpacing: "-0.025em"
rounded:
  horizon: "3px"
  specimen: "0"
  relay: "7px"
  relay-evidence: "8px"
  relay-press: "11px"
spacing:
  control-gap: "10px"
  motion-gap: "16px"
  section-gap: "30px"
  evidence-padding: "25px"
  results-gap: "36px"
components:
  horizon-button-primary:
    backgroundColor: "{colors.horizon-accent}"
    textColor: "{colors.horizon-accent-ink}"
    rounded: "{rounded.horizon}"
    padding: "14px 19px"
  horizon-search:
    backgroundColor: "{colors.horizon-paper}"
    textColor: "{colors.horizon-ink}"
    rounded: "{rounded.horizon}"
    height: "39px"
    padding: "0 12px"
  specimen-button-primary:
    backgroundColor: "{colors.specimen-accent}"
    textColor: "{colors.specimen-accent-ink}"
    rounded: "{rounded.specimen}"
    padding: "14px 20px"
  specimen-search:
    backgroundColor: "{colors.specimen-paper}"
    textColor: "{colors.specimen-ink}"
    rounded: "{rounded.specimen}"
    height: "39px"
    padding: "0 12px"
  relay-button-primary:
    backgroundColor: "{colors.relay-accent}"
    textColor: "{colors.relay-accent-ink}"
    rounded: "{rounded.relay}"
    padding: "14px 18px"
  relay-search:
    backgroundColor: "{colors.relay-paper}"
    textColor: "{colors.relay-ink}"
    rounded: "{rounded.relay}"
    height: "39px"
    padding: "0 12px"
---

# Design System: SEGESTA comparison — PROVISIONAL

## Overview

**Creative North Star: "Three complete worlds, awaiting a choice"**

PROVISIONAL: this file records three implemented, unselected alternatives. It applies only to this local comparison, not the production application or earlier prototype rounds. No approved comp or winning design exists. The user must select a direction before production integration.

Horizon makes the researcher story cinematic through an original illustrated laboratory. Specimen makes evidence feel like an annotated scientific field guide. Relay makes the same research leads feel like a working research workspace. SEGESTA informed animation and storytelling; it did not establish a mountain or city identity.

**Key Characteristics:**

- Three complete websites with Problem & solution, Workflow and Results.
- Distinct palettes, display type, navigation, diagrams, reading order and motion.
- Shared labelled example data, inspectable evidence and explicit research limitations.
- Laptop-first comparison; narrower layouts are fallbacks, not a phone design commitment.

Source authority: `web/src/prototypes/segesta/base.css`, `Horizon.css`, `Specimen.css`, `Relay.css` and their React components. The frontmatter prefixes primitives by world because no world is selected. Values describe the implementation, not a proposed harmonized scale. The neutral comparison shelf and standard picker are comparison infrastructure, not identity tokens. Root `PRODUCT.md` contains earlier-round exploration names; this directory’s `README.md` is the current comparison scope.

## Colors

### Primary

- **Horizon mint**: the primary action against plum; dark green action text preserves the scene’s softer character.
- **Specimen forest**: the primary action, numbered active stages and scientific emphasis against warm paper.
- **Relay coral**: the primary action and selected explanatory emphasis against an ink-and-paper workspace.

### Secondary

The `disease` tokens distinguish disease-related diagrams and sample ranking paths: peach in Horizon, terracotta in Specimen and amber in Relay. Their meaning is reinforced with text and diagram labels.

### Tertiary

The `tertiary` tokens separate additional diagram paths: lilac in Horizon, ochre in Specimen and teal in Relay. They do not signal clinical success or safety.

### Neutral

Every world defines ground, paper, ink, muted, rule and soft roles in its own scope. Horizon uses dark layered plum, Specimen uses warm paper and a butter annotation plate, and Relay combines white workspace panels with a fixed ink rail. Network-node and network-rule tokens remain local to their world.

**The Separate Worlds Rule.** Keep the three worlds distinct until a direction is selected; do not combine their palettes or component treatments into a production identity.

## Typography

**Horizon display:** self-hosted Sora, exposed as `Scene Sora`, with sans-serif fallback. **Horizon body:** Instrument Sans Variable.

**Specimen display:** self-hosted Newsreader, exposed as `Scene Newsreader`, with Georgia/serif fallback and real italic face. **Specimen body:** self-hosted DM Sans, exposed as `Scene DM Sans`.

**Relay display:** DM Sans, exposed as `Scene DM Sans`. **Relay body:** Instrument Sans Variable. Motion labels consistently use Instrument Sans across the comparison.

The three display ramps and key result-heading roles are recorded in frontmatter. These are distinct ramps, not interchangeable levels of one family. Horizon’s geometric display is light and spacious; Specimen’s serif question and italic phrases evoke a research publication; Relay’s compact medium-weight sans display supports operation. Body inheritance starts at the recorded interface/body roles; individual explanations use smaller type. Hero paragraphs use a generous line height (1.8), with Specimen and Relay constrained to 42ch and 43ch respectively. Labels and table annotations range from 8–13px in the current laptop implementation; these small values are observations, not a universal accessibility minimum.

**Font provenance:** Sora, Newsreader normal/italic and DM Sans WOFF2 files are reused from `web/src/prototypes/round-three/assets/`; their adjacent license files credit the Sora, Newsreader and DM Sans project authors under SIL OFL 1.1. Instrument Sans is locally bundled from `@fontsource-variable/instrument-sans/wdth.css` in the prototype entry. No remote font request is required.

## Layout

All three reserve a fixed neutral comparison shelf (72px high) and a matching spacer. Switching directions or tabs resets scroll instantly. Layout remains at original scale rather than shrinking three websites into cards.

- **Horizon:** a horizontal header, edge-to-edge laboratory hero, content inset by 5.3%, and a two-column shortlist/details layout (1.65fr/1fr, 30px gap). The scene height is viewport-related with a 650px minimum and 780px maximum. Its four workflow stages form a horizontal strip above the explanation. At 1200px density reduces; at 900px header and main content stack, stage choices become two columns and results become one column.
- **Specimen:** a separate ruled tab row, main inset of 5%, and a two-column question/annotated plate hero (1.08fr/1fr, 7% gap). Workflow uses a 300px numbered left margin and right explanation. Results put evidence before the wider ledger (0.8fr/1.5fr, 5% gap). At 1200px the stage margin narrows to 265px; at 900px hero, workflow and results stack, with evidence ordered after the table.
- **Relay:** a fixed left rail (235px) starting below the comparison shelf, an offset main body and 4.5% main inset. Workflow has four cards above a two-column process panel; results use a full-width shortlist and evidence below. The rail narrows to 200px at 1250px and 180px at 1000px. At 1000px the hero/process/evidence stack and stages become two columns. At 650px the rail becomes a normal-flow header with horizontal navigation.

Spacing in frontmatter records recurring observed values; the source uses contextual spacing rather than a single mathematical scale. Tables retain their scrolling wrapper, search and sort wrap, and metadata can wrap independently. Narrow-screen rules are resilience fallbacks; the requested design target is a laptop.

## Elevation & Depth

Horizon gets depth from the original scene, gradient text scrim, camera drift and layered diagrams; it does not use raised UI cards as its main material. Specimen stays flat, using fine rules, butter plate fills and whitespace. Relay uses tonal workspace containers and a small diffuse shadow only beneath moving evidence tickets (`0 5px 12px #26392b08`). No hard offset shadow is a shared rule.

**The Explainable Motion Rule.** Motion explains a research step and retains pause, replay and reduced-motion alternatives.

Horizon adds an 18-second scene camera cycle, microscope inspection and rising flask bubbles, plus three selectable autoplay story chapters. Specimen uses a circular annotated network plate and a moving research ledger. Relay uses a moving evidence press, orthogonal biological map and a six-second animated reorder. Shared diagrams show network flow, reviewer activity and ranked paths. Exact timings and easing live in the sidecar; these animations remain illustrative.

## Shapes

Horizon has lightly eased corners; Specimen’s sheet-like surfaces and actions are square, with circles reserved for diagram nodes and stage numbers. Relay uses softly rounded controls and larger workspace containers. The frontmatter records observed repeated radii. Hairline borders divide evidence, navigation and tables in each world. Circles indicate nodes, status, inspection and sequence rather than a universal card shape.

## Components

### Buttons

Primary actions are compact, solid and paired with an authored arrow SVG. Each world’s padding and color pairing is recorded in frontmatter. Secondary actions are transparent with the local rule border and ink text; text actions omit the box. Fine-pointer hover brightens solid actions (1.06); pressing scales buttons (0.98). All controls retain a visible 2px accent outline with 5px offset on keyboard focus. Shared color/background transitions last 160ms and press transforms 140ms, both ease-out.

### Navigation

All websites expose Problem & solution, Workflow and Results through labelled buttons, with `aria-current="page"` on the current destination. Horizon uses a small mint current-page dot, Specimen uses a ruled underline and Relay uses a filled rail row with an arrow. Selection switches content and returns to the document top. The separate comparison picker selects whole websites, persists `?v=1`, `?v=2` or `?v=3`, and supports 1/2/3, left/right and R; shortcuts ignore editable fields and modifiers.

### Inputs / Fields

Compound/protein search and native five-mode sorting share paper fills, local rule borders and local radius. The search wrapper and select are 39px high; search labels remain programmatic. Filtered rows drive the CSV export. An empty query result has an explicit reset action and hides candidate evidence rather than showing a stale selection.

### Cards / Containers

Evidence sheets use local paper, hairline borders and contextual padding. Horizon places one beside the table; Specimen makes it a ruled evidence column; Relay makes it a wide soft panel below the table. Candidate headings and the optional Known reference badge wrap independently. Evidence, AI review and Molecule buttons use `aria-pressed` for the current detail view. The reference badge is metadata, not an efficacy claim.

### Scientific and motion components

Every world uses the same 15 labelled example candidates, recorded independent AI review and recorded molecular structures. Network/proximity, evidence and current shortlist policy remain separately described. These are fictional legacy-proximity fixture ranks/scores/reviews, not live RWR results. The current application policy combines 10 physical-network RWR and 5 supported direct-evidence candidates, with deduplication/refill and possible coverage shortfalls. Paths provide context, not proof of mechanism. Molecular rotation uses a labelled slider to inspect a recorded conformer, not a docking pose. Missing structure and empty-result states are explicit. Sources open through labelled evidence links. No live run, save or docking action is simulated as successful.

Animations autoplay, expose pause/play and replay controls, and support manual workflow stage selection; manual stage selection pauses progression. Pause freezes CSS animation and sequence timers. Hidden tabs suspend playback. Reduced-motion preference removes scene animation/transitions and automatic progression, disables the play toggle, labels the state and retains manual navigation. The comparison includes a skip link and uses semantic buttons, tables and labelled navigation.

**Image provenance:** Horizon’s `web/src/prototypes/segesta/assets/laboratory.jpg` is original built-in `image_gen` output, converted to JPEG at quality 88. Its exact prompt and source are recorded in adjacent `laboratory.jpg.json` and embedded metadata. The supplied microscope image informed subject matter only; no watermark removal or stock-image edit is shipped. Specimen and Relay use authored interface/diagram SVG material rather than background photography.

## Do's and Don'ts

### Do:

- **Do** preserve each world’s display family, palette and navigation when extending this comparison.
- **Do** keep example-data and scientific limitations visible beside research results.
- **Do** keep the candidate title and reference badge free to wrap independently.
- **Do** use authored SVG icons and functional stage counts.
- **Do** preserve labelled controls, keyboard focus and reduced-motion behavior.

### Don't:

- **Don’t** promote any of these provisional worlds to the root production design system before the user chooses.
- **Don’t** treat SEGESTA as authority for mountain scenery.
- **Don’t** relabel legacy proximity fixture scores as current RWR results or a recorded conformer as a docking pose.
- **Don’t** reintroduce redundant heading eyebrows or Unicode glyph icons removed by finish review.

Not canonized: the initial finish review’s redundant heading eyebrows, Unicode icon glyph and compressed candidate heading were corrected in source. No winning identity is inferred from those fixes. The detector’s Instrument Sans advisory remains an acknowledged interface-font tradeoff in Relay; it is not a reason to change the already distinct display systems. Root product exploration names describe earlier rounds and were left unchanged by this scoped documentation pass.
