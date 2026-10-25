---
title: The docking toolchain stays in its own venv for good; it never joins the uv workspace
author: Abudi
date: 2026-10-25
branch: abdullah-nextverse/workstream-c
cost: { minutes: 2, tokens: 44887 }
id: l-991a2cad
scope: repo
status: active
replaces: l-74d17001
src: agent
touches:
  - ranking/SHORTLIST_HANDOFF.md
  - ranking/tests/test_application_shortlist.py
  - workstream_b/application_shortlist.py
  - ".devcontainer/docking-requirements.txt"
  - pyproject.toml
  - uv.lock
  - worker/oxhack_worker/queue.py
  - ".devcontainer/post-create.sh"
  - ".agents/skills/caveman/SKILL.md"
---

## Decided
- `.devcontainer/Dockerfile` pins linux/amd64: AutoDock Vina 1.2.7 has Linux x86_64 wheels only.
- The docking toolchain stays in `$DOCKING_VENV`, locked in `.devcontainer/docking-requirements.txt`, permanently. The amd64 learning (l-74d17001) said to move it into a `docking` dependency group once the worker had a pyproject.toml; the worker now has one, but Vina cannot join the cross-platform `uv.lock`, so `worker/oxhack_worker/queue.py` runs the docking venv as a subprocess instead (`.devcontainer/post-create.sh`).
- PR #4 (codespaces) was merged into workstream C without PDBFixer; the lock stays `--only-binary :all:` on x86_64-manylinux_2_28.

## Tried and ruled out
- ProDy: no Python 3.11 wheel. PDBFixer: sdist only, and its rebuilt side chains broke Meeko (see the Vina docking learning, l-14b52079).

## Watch out
- On Apple Silicon, turn on Docker Desktop's "Use Rosetta for x86_64/amd64 emulation"; QEMU segfaults running uv.
- Login shells re-prepend the image's Python; post-create.sh puts `$DOCKING_VENV/bin` first again in ~/.bashrc and ~/.zshrc.
