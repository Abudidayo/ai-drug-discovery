---
title: Caveman is off by default; AGENTS.md holds the only reply defaults and CLAUDE.md imports it
author: Jessica
date: 2026-10-24
branch: Jessica-mak/hackathon-build-plan
cost: { minutes: 1, tokens: 18715 }
id: l-54019cec
scope: repo
status: active
replaces: l-812c3060
touches:
  - AGENTS.md
  - CLAUDE.md
  - ".agents/install-skills.py"
  - skills.md
---

## Decided
- Caveman is not a default. Jessica found Caveman replies hard to read, so readable replies win over the token savings. The skill stays installed for on-demand use (`/caveman`, `stop caveman`).
- AGENTS.md holds the only shared reply default: the Trail closing-line preference. CLAUDE.md contains only `@AGENTS.md`, so Claude Code reads that block once.
- `.agents/install-skills.py` no longer adds a Caveman block. It leaves an existing one alone, skips a CLAUDE.md that imports AGENTS.md, and creates a fresh CLAUDE.md with only the import. `.agents/test_install_skills.py` covers this (16 pass).

## Tried and ruled out
- Copying the default blocks into both CLAUDE.md and AGENTS.md. Claude loaded every instruction twice.
- Caveman as the team default for token savings. Ruled out as too hard to read.
