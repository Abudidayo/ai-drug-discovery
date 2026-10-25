---
title: Anonymous sessions isolate experiments; paid quotas live in the shared repo
author: Abudi
date: 2026-10-25
branch: fixes
id: l-e6229fe6
scope: repo
status: active
src: agent
touches:
  - api/oxhack_api/services/experiments.py
  - api/oxhack_api/repo/postgres.py
  - web/src/api/client.ts
  - ".github/workflows/deploy.yml"
---

The API uses a random HttpOnly oxhack_session cookie and stores only its SHA-256 owner hash on experiments. Keep ServiceDep browser ownership checks for every experiment child operation; public redocking controls have no experiment_id. Reused private docking files must be presented through the requesting browser-owned job URL, or cross-browser cache reuse will fail authorization. Serialize the first frontend API response so concurrent initial requests cannot overwrite each other with different fresh cookies. Work and Cortex attempt quotas belong in Repo.consume_quota so API and workers share durable Postgres counters, including retries and worker recovery. Reserve global work quota only after validation; invalid disease IDs must not exhaust the shared daily budget. Playwright must use dedicated fresh servers by default; reusing localhost:8000 can silently test another workspace. CI skips docs-only application jobs through a changes job while always publishing the stable test gate; deployment uses the immutable tested SHA and aborts on migration failure.
