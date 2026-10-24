---
title: Open Targets API occasionally resets connections; upstream calls must retry
author: Abudi
date: 2026-10-24
branch: main
cost: { minutes: 6, tokens: 22877 }
id: l-23cc350c
scope: repo
status: active
src: agent
touches:
  - demos/data-sources/README.md
  - demos/data-sources/index.html
  - demos/data-sources/server.mjs
---

## Decided
- demos/data-sources/server.mjs retries read-only upstream calls on ECONNRESET, EPIPE, ETIMEDOUT, EAI_AGAIN, UND_ERR_SOCKET and HTTP 502/503/504: up to 3 tries (250 ms, 750 ms backoff) inside one shared 15 s deadline. The real pipeline should do the same for Open Targets, ChEMBL and PubChem.

## Tried and ruled out
- Stale keep-alive sockets were the first suspect. Ruled out: 90 of 90 requests succeeded, including after 5-95 s idle gaps and 30 in parallel. The reset (seen once, 67 ms, from Open Targets' Google front end) is a transient network event, not reproducible on demand.

## Watch out
- To test retry paths, point OPEN_TARGETS_URL, CHEMBL_BASE or PUBCHEM_BASE at a local fake server that calls req.socket.resetAndDestroy(); an invalid hostname gives ENOTFOUND, which is deliberately not retried.
