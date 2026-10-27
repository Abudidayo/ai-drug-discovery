---
title: "Vercel-only hosting: Sandbox process status never reports a detached command's exit; Python builder installs only the workspace root"
author: Abudi
date: 2026-10-27
branch: vercel-frontend
cost: { minutes: 97, tokens: 623860 }
id: l-effd9708
scope: repo
status: active
src: agent
touches:
  - ".github/workflows/deploy.yml"
  - app/api/oxhack_api/security.py
  - app/api/oxhack_api/settings.py
  - app/api/tests/test_security.py
  - app/web/.gitignore
  - app/web/.prettierignore
  - app/web/vercel.json
---

## Decided
HalfLife runs entirely on Vercel's free Hobby plan (deploy/vercel/README.md). The API is one large Python function (VERCEL_SUPPORT_LARGE_FUNCTIONS=1; it worked on Hobby). The database is Neon through the Vercel integration. Jobs drain after responses (app/api/oxhack_api/drain.py), and docking runs in Vercel Sandbox (app/worker/oxhack_worker/sandbox.py). CI deploys a folder assembled by deploy/vercel/build.py with `vercel build` and `vercel deploy --prebuilt`.

## Tried and ruled out
- Docking inside the function: on 2 CPUs venetoclax takes about 450 s, past Hobby's 300 s. The API plus the toolchain is 576 MB, over the 500 MB Python limit without large functions.
- Pointing Vercel at the repository: its Python builder installs only the uv workspace's root project from uv.lock, so FastAPI and the other members never got installed.
- The legacy api/index.py with a rewrite: FastAPI received the path "/api/index.py", so every route 404ed.
- Polling `SyncProcess.refresh()` or `get_process()` on a detached command (vercel 0.12.1): the status stays "running" after the process exits until someone calls `get_process(id, wait=True)`. The run now writes its exit code to a file, and `timeout --signal=KILL` enforces the limit.

## Watch out
- Vercel refuses any single deployment file over 100 MB. The 158 MB distances.npy ships as `.vercel.gz` and deploy/vercel/index.py restores it into /tmp.
- Route env vars and other project env vars take effect only on the next deployment.
- `vercel build` on macOS installs macOS wheels. Build prebuilt output on Linux (CI) or use a remote build (`vercel deploy` without --prebuilt).
- The Snowflake PAT fails from every IP with 401 "Network policy is required" (checked from the Codespace too, 27 Oct 2026). Until the Snowflake user gets a network policy, the Cortex jury fails with AuthenticationError.
- Sandbox venetoclax runs ranged from 96 s to over 200 s on 4 vCPUs, so never tie a dock to one function's lifetime.
