---
title: The dev container is amd64-only and keeps docking in its own venv
author: Abudi
date: 2026-10-24
branch: abdullah-nextverse/codespaces
cost: { minutes: 35, tokens: 125976 }
id: l-74d17001
scope: repo
status: active
src: agent
touches:
  - ".devcontainer/Dockerfile"
  - ".devcontainer/README.md"
  - ".devcontainer/devcontainer-lock.json"
  - ".devcontainer/devcontainer.json"
  - ".devcontainer/docking-requirements.in"
  - ".devcontainer/docking-requirements.txt"
  - ".devcontainer/post-create.sh"
  - README.md
  - docs/build-reference.md
---

## Decided
- `.devcontainer/Dockerfile` pins `FROM --platform=linux/amd64`: AutoDock Vina 1.2.7 ships Linux wheels for x86_64 only (no aarch64), so an arm64 container on a Mac cannot install it.
- The docking toolchain lives in a separate venv (`$DOCKING_VENV`, on PATH as `python`), locked in `.devcontainer/docking-requirements.txt`. `uv sync` is exact and would delete packages it does not own from the project `.venv`. Move them into a `docking` dependency group once the worker has a `pyproject.toml`.

## Tried and ruled out
- ProDy in the docking set: no Python 3.11 wheel exists (latest 2.6.1 is cp312+), so `--only-binary` resolution fails. gemmi covers receptor clean-up (build reference C3).

## Watch out
- On Apple Silicon, Docker Desktop's QEMU emulation segfaults running uv (`qemu: uncaught target signal 11` in the uv feature) and pip installs crawl. Turn on Settings → General → "Use Rosetta for x86_64/amd64 emulation" before "Reopen in Container".
- `gh auth refresh` has no `-u` flag; it refreshes the active account. Run `gh auth switch -u Abudidayo` first.
