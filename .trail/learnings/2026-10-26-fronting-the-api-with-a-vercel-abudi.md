---
title: Fronting the API with a Vercel /api rewrite breaks the write origin check and per-IP limits in security.py
author: Abudi
date: 2026-10-26
branch: fix-network-persist-flake
cost: { minutes: 4, tokens: 180431 }
id: l-f5a39f1d
scope: repo
status: active
src: agent
touches:
  - web/vite.config.ts
  - web/src/api/client.ts
  - api/oxhack_api/security.py
  - ".github/workflows/deploy.yml"
---

## Decided
The backend can't run on Vercel: the pipeline and Vina workers run for minutes, and it needs PostgreSQL, about 0.5 GB of prepared data in `data/` and a natively built Vina. If the user wants a Vercel URL, Vercel can serve only the static `web/` build and proxy `/api` to the Oracle VM, since the browser only ever calls same-origin `/api` (`web/vite.config.ts`, `web/src/api/client.ts`). The frontend polls rather than streaming, so a rewrite proxy is enough. As of 26 Oct 2026 the user had not chosen between this split and Oracle-only.

## Watch out
- `api/oxhack_api/security.py` `BrowserSecurity` rejects non-GET requests whose `Origin` netloc differs from `Host`. Behind a Vercel rewrite, Origin is the vercel.app domain and Host is the Oracle hostname, so every write gets a 403 unless allowed origins are configured.
- The same middleware keys rate limits on the ASGI peer IP. Through Vercel every visitor shares Vercel's egress IPs, and with them one bucket. Vercel rewrites can't add request headers, so trusting a forwarded IP needs a Vercel function proxy that adds a shared-secret header.
- With a Vercel proxy in front, the Oracle origin still needs HTTPS. `<ip>.sslip.io` works without DuckDNS sign-in.
- Deploy Vercel from CI with the same tested SHA as Oracle (`.github/workflows/deploy.yml`), not through Vercel's own Git integration, so the frontend and API versions stay in lockstep.
