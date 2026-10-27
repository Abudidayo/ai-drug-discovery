---
title: "Vercel Hobby allows 5,000 uploaded deployment files a day: pack many-file data folders and let Vercel build"
author: Abudi
date: 2026-10-27
branch: vercel-upload-limits
cost: { minutes: 34, tokens: 874221 }
id: l-29be982e
scope: repo
status: active
src: agent
touches:
  - ".github/workflows/deploy.yml"
  - deploy/vercel/README.md
  - ".devcontainer/README.md"
  - README.md
  - app/api/oxhack_api/app.py
  - app/api/oxhack_api/drain.py
  - app/api/oxhack_api/jobs.py
  - app/api/oxhack_api/jobs_pg.py
  - app/api/oxhack_api/repo/base.py
  - app/api/oxhack_api/repo/memory.py
---

## Decided
deploy/vercel/build.py packs every data folder holding more than 100 files (chembl-37 with 2,400 files, the packets HTTP cache with 969, ligands) into one `<name>.vercel.tgz`. deploy/vercel/mirror.py unpacks them into the /tmp mirror on cold start, about 160 MB more in /tmp, under its 512 MB. A deploy is about 250 files. CI runs `vercel deploy` (a remote build), not `vercel build` plus `--prebuilt`, so Vercel installs the roughly 5,700 Python package files on its own machines.

## Tried and ruled out
- The first CI deploy (27 Oct 2026), a prebuilt upload of the 3,866-file folder, failed with "Too many requests - try again in 24 hours (more than 5000, code: api-upload-free)". The day's earlier manual deploys had used up the quota.

## Watch out
- Once the quota is hit, every deploy fails for up to 24 hours. Avoid repeated manual full deploys on Hobby.
- A folder that crosses 100 files later is packed automatically. A single file over 100 MB is gzipped as `.vercel.gz`.
