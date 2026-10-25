# Product

<!-- impeccable:product-schema 1 -->

Project name: **Half Life**.

## Platform

web

## Current Exploration

The selected Half Life website at `/prototypes/` renders Keynote directly, with Problem & solution, Workflow and Results tabs. Historical explorations remain separate from the active website; its comparison picker is removed. The work is on `Jessica-mak/half-life-ui`, branched from the original website exploration.

The problem introduction uses the original layered laboratory illustration and a smooth, controllable narrative camera. Its secondary action is labelled Live demo. Workflow shares its implementation with `/prototypes/workflow-review/`. Story retains five chapters. Technical is one page with fixed labels and concrete visuals for network links, the RWR/direct-evidence shortlist, exact source citations, three parallel AI reviews, rank comparison, TigerData and optional predicted docking poses. The heading is Workflow. Algorithms, sources, selection counts and models remain visible; the original full engineering diagram and longer explanations expand under Technical details. Exact archived evidence and docking inspectors remain available.

Playback autoplays and supports pause, replay, hidden-tab pausing and reduced motion. Technical graphics are schematic except for the explicitly archived E2 source excerpt. Header, footer and navigation groups are transparent, without fixed background bands or outline frames. The Half Life wordmark remains prominent. See `web/prototypes/ROUND_THREE.md` for preview and validation commands.

## Users

Hackathon judges seeing the idea for the first time are the primary audience (confirmed by the user). Researchers exploring drug repurposing are the people the project helps.

## Product Purpose

Help researchers explore existing drugs whose protein targets connect to the biology of a disease, inspect supporting evidence, and compare hypotheses.

## Operating Context

A hackathon project. The React web application is imported into `web/` from the initially fetched `origin/abdullah-nextverse/workstream-c` snapshot at commit `598013f`, without changing the current workspace branch. This pins the source provenance even if the remote branch advances.

## Capabilities and Constraints

Laptop layouts are the current priority. The user explicitly excluded phone work from this redesign.

The imported source application provides the underlying app scaffold and fixture contracts. The selected website uses its own entry in `web/prototypes/` and implementation in `web/src/prototypes/`; it does not replace the source application's routing. Earlier Story, Atlas, Workbench and other design explorations remain archived routes, rather than active choices in the selected website.

Website interactions use explicitly labelled example data. They do not execute live experiments, save to a server or run docking. The current selected technical jury is GPT-5.4, GLM-5.3 and Kimi K3 via Snowflake Cortex; the older fixture's model names and fictional results do not determine that selection. Integration with live experiments remains separate.

The current application shortlist defaults to `physical_rwr`: 10 candidates from random walk with restart on the physical network plus 5 candidates from direct evidence, with deduplication and refill. Incomplete coverage can produce fewer candidates. This policy is documented in `ranking/SHORTLIST_HANDOFF.md` and implemented in `workstream_b/application_shortlist.py`.

## Evidence on Hand

Source copy: `web/src/copy/en.ts`. Source fixture data: `api/oxhack_api/fixtures/` from commit `598013f`. Scientific reference supplied by the user: `.context/attachments/y2ocre/pasted_text_2026-10-25_05-14-52.txt`.

The prototype fixture ranks, scores, and AI reviews are fictional and reflect the legacy proximity workflow; they do not demonstrate the current RWR ranking policy. The previews use recorded molecular conformers and network edges. Rotating a molecule shows its structure, not a validated docking pose.

Proximity paths provide network context; they do not directly explain an RWR score or prove a mechanism. Three Cortex AI reviewers critique evidence. Optional Docker/Vina docking is separate from ranking. Rankings, AI reviews, and docking poses remain research hypotheses, not clinical efficacy findings. Research performance claims must retain the limitations in the repository's result reports.

## Brand Commitments

Clean, simple visual style. Visualisations must explain the project and workflow, and results must include animation and tables.

## Product Principles

- Explain the researcher problem before introducing technical detail.
- Show how evidence changes a candidate's priority.
- Keep next actions apparent and detail available on demand.
- Make demonstration data and uncertainty explicit.
