---
title: "A data tarball made with macOS tar broke production: its ._*.parquet files crash DuckDB's glob on cold start"
author: Abudi
date: 2026-10-27
branch: vercel-deploy-safety
cost: { minutes: 15, tokens: 31684 }
id: l-029459c1
scope: repo
status: active
src: agent
touches:
  - ".github/workflows/deploy.yml"
  - deploy/tests/test_vercel_build.py
  - deploy/vercel/README.md
  - deploy/vercel/build.py
  - deploy/vercel/index.py
  - deploy/vercel/mirror.py
---

## Decided
Make the data release with `COPYFILE_DISABLE=1 tar ... --exclude='._*'` (deploy/vercel/README.md). deploy/vercel/build.py also drops `._*` and `.DS_Store` whatever the source, and CI rolls production back with `vercel rollback` when the post-deploy release or health check fails (.github/workflows/deploy.yml).

## Tried and ruled out
- Trusting the tarball. macOS bsdtar adds AppleDouble `._<name>` files for files with extended attributes. CI unpacked `ot/clinical_indication/._00000000.parquet`, LiveSource's `read_parquet(dir/*.parquet)` hit "No magic bytes found", index.py failed to import, and every request returned FUNCTION_INVOCATION_FAILED (27 Oct 2026). Promoting the previous deployment (`vercel promote <url>`) restored the site.

## Watch out
- A grep with `\|` alternation does not work in macOS grep. Check a tarball for metadata with Python's tarfile, not `grep -c '/\._\|...'`.
- release.json needs `Cache-Control: no-store`, or CI's SHA check right after a deploy can read a stale copy.
