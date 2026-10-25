---
title: "Tiger Cloud: CLI login hangs headless, and how the oxhack schema models jurors and controls"
author: Abudi
date: 2026-10-24
branch: abdullah-nextverse/changes
cost: { minutes: 4, tokens: 45236 }
id: l-6a8f882e
scope: repo
status: active
src: agent
touches:
  - db/migrations/0001_initial.sql
---

## Decided
- Service `oxhack` (id gqjab0gz4n, project i1i7tehdcw, eu-west-2, 0.5 CPU / 2 GB, time-series add-on) holds the plan.md 9.3 tables. Schema lives in `db/migrations/0001_initial.sql`; apply new numbered files with `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f`.
- Juror calls get their own `jurors` table (status, attempts, latency, validation, raw output) and `jury_votes` holds only reviews from valid jurors. An invalid or failed juror has no reviews, so one-row-per-vote alone could not record it, and plan 5 forbids inventing a vote.
- `dock_jobs.experiment_id` is null for `redock_control` / `negative_control` rows: controls belong to a prepared structure (build-reference C9), not to an Experiment. A cache hit inserts a new row with `cached_from` pointing at the original job, so each Experiment keeps its own docking history without re-running Vina.
- The Disease ID check uses `^[A-Za-z]+_[A-Za-z0-9]+$` (Jessica's stream-a fix, allows `NCIT_C74532`), not the digits-only regex still on main.

## Watch out
- `tiger auth login` stores the session right after the browser step, then waits on an interactive prompt when run without a TTY. `tiger auth status` already shows "Logged in" at that point, so the hung process can be killed.
- The service password is not printed by `tiger service create`; it goes to the keychain. Get it with `tiger db uri oxhack --with-password`.
- Loading `fixtures/jury_result.json`: an invalid juror's `reviews` is JSON null, not `[]`; guard with `jsonb_typeof` before `jsonb_array_elements`.
