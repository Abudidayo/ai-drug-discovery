---
title: Quiet reply defaults need project guidance and a standing preference
author: Jessica
date: 2026-10-24
branch: Jessica-mak/shared-skill-defaults
cost: { minutes: 8, tokens: 134891 }
id: l-1a5abc68
scope: repo
status: active
touches:
  - ".agents/install-skills.py"
  - skills.md
---

## Decided

The team wants Trail closing lines omitted while retaining Trail's code map,
notes and checks. `.agents/install-skills.py` installs the preference in
`AGENTS.md`, `CLAUDE.md` and `.trail/learnings/`; `skills.md` documents setup.
Use both routes because Trail startup guidance can request a closing line after project instructions load. The standing preference carries the team choice into that startup guidance.

## Tried and ruled out

Disabling the checking workflow or deleting prior learnings would hide useful
context rather than meet the requested behavior. Both were rejected.

## Watch out

Trail 0.24.1's lexical check flags four references to agent instructions, hooks
and closing lines in these setup changes against the earlier quiet-reply
learning. Those references explain and implement suppression; they do not ask
for a visible footer. Review the actual behavior and record this reasoning in
the commit or PR instead of changing the requested preference to silence the
warnings. Existing instructions and learnings must remain intact.
