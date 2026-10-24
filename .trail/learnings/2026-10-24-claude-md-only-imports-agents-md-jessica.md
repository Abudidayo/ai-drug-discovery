---
title: CLAUDE.md only imports AGENTS.md; the installer must not repeat the defaults there
author: Jessica
date: 2026-10-24
branch: Jessica-mak/hackathon-build-plan
cost: { minutes: 2, tokens: 24638 }
id: l-812c3060
scope: repo
status: active
touches:
  - CLAUDE.md
  - ".agents/install-skills.py"
---

## Decided
- CLAUDE.md contains only `@AGENTS.md`. The Caveman and Trail-reply defaults live once, in AGENTS.md. Claude Code reads them through the import and Codex reads AGENTS.md directly.
- `.agents/install-skills.py` skips CLAUDE.md when it imports AGENTS.md, and creates a fresh CLAUDE.md with only the import. Two tests cover this in `.agents/test_install_skills.py` (16 pass).

## Tried and ruled out
- Copying the default blocks into both files. Claude then loaded every instruction twice, wasting tokens each session.

## Watch out
- A CLAUDE.md without the `@AGENTS.md` line still gets the blocks appended, so Claude keeps the defaults.
