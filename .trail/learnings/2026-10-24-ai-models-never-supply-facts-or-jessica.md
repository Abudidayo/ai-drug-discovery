---
title: AI models never supply facts or rankings; every claim must cite fetched database evidence
author: Jessica
date: 2026-10-24
branch: Jessica-mak/hackathon-build-plan
cost: { minutes: 1, tokens: 1332 }
id: l-e7a349d8
scope: repo
status: active
touches:
  - plan.md
  - oxhack_rgcn_integrated_plan.md
---

## Decided
- The team's priority is no hallucination: this is a research-based project, so everything shown must rest on fetched evidence. Candidates, scores and facts come only from Open Targets and ChEMBL records. The shortlist and ranking come from a deterministic evidence score, not from an LLM.
- LLM jurors only review the fetched evidence packet. Every sentence must cite an evidence ID from that packet. Code rejects any ID that wasn't fetched, re-asks once, then drops that juror for the run. The UI shows the citation-validity rate, and every displayed fact links to its source record.

## Watch out
- RGCN does not hallucinate text, but its scores are graph-pattern predictions, not evidence. Show them as a separate labelled column, never as a fact or a reason.
- If stricter is wanted, the evidence score stays the final ranking and the jury becomes commentary only. Removing the jury entirely would forfeit the Snowflake prize.
