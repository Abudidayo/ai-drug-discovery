---
title: "Behind Vercel, trust X-Vercel-Forwarded-For with the edge secret; X-Forwarded-For is client-spoofable and X-Real-IP never arrives"
author: Abudi
date: 2026-10-26
branch: vercel-frontend
cost: { minutes: 34, tokens: 289508 }
id: l-f0538dca
scope: repo
status: active
replaces: l-f5a39f1d
src: agent
touches:
  - app/api/oxhack_api/settings.py
  - app/api/oxhack_api/security.py
  - deploy/oracle/setup.sh
  - app/api/tests/test_security.py
  - deploy/oracle/configure-ci.sh
  - deploy/vercel/connect.py
  - ".github/workflows/deploy.yml"
  - deploy/oracle/provision.py
---

## Decided
Vercel serves `app/web` and forwards `/api/*` to the Oracle origin (`<ip>.sslip.io`) through a `routes` entry in `app/web/vercel.json`. The backend can't run on Vercel: its workers run for minutes, and it needs PostgreSQL, about 0.5 GB of `data/` and a natively built Vina. A route `transforms` entry sets `x-halflife-edge` from the `HALFLIFE_EDGE_SECRET` env var, so no Vercel function is needed. `api/oxhack_api/security.py` `BrowserSecurity.peer` uses `X-Vercel-Forwarded-For` only when that secret matches (hmac.compare_digest). Writes from the Vercel domain pass via `OXHACK_TRUSTED_ORIGINS`, because the Origin netloc never equals the forwarded Host. `deploy/vercel/connect.py` keeps the secret, Vercel env, GitHub settings and the VM's app.env in sync.

## Tried and ruled out
- Trusting `X-Real-IP`: Vercel's rewrite docs list it, but a live header echo behind the route (26 Oct 2026) never received it.
- Trusting `X-Forwarded-For`: a visitor's own value passed through unchanged (sent 1.2.3.4, the origin received 1.2.3.4). `X-Vercel-Forwarded-For` and `Forwarded` were overwritten with the real IP.
- DuckDNS: it needed another sign-in. sslip.io needs none and has a raised Let's Encrypt limit.

## Watch out
- Route env vars (`${HALFLIFE_API_ORIGIN}` in dest, `$HALFLIFE_EDGE_SECRET` in transforms) are fixed when Vercel deploys. Changing them through the API has no effect until the next deployment.
- `halflife.vercel.app` was taken, so the project got `halflife-nine.vercel.app`. `halflife-bio.vercel.app` was added as an alias through POST /v10/projects/{id}/domains.
- On a free tenancy, Stockholm (one AD) answered A1 launches with `500 Out of host capacity`. Everything except the instance had been created, so the fix is to rerun `deploy/oracle/provision.py` until it launches.
