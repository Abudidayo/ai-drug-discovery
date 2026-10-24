---
title: "Postgres repo and job queue: why 0003 exists and what guards archive"
author: Abudi
date: 2026-10-24
branch: abdullah-nextverse/workstream-c
cost: { minutes: 1, tokens: 1585 }
id: l-fa48f34c
scope: repo
status: active
src: agent
touches:
  - api/oxhack_api/jobs.py
  - api/tests/conftest.py
---

## Decided
- The 0001/0002 tables could not hold the API contract: jurors only allowed valid/invalid/failed with attempts > 0 (the API shows pending and running jurors, and a juror that never got asked is failed with 0 attempts), jury_votes.label was required but recorded reviews have no packet label, and dock_jobs had no fixture flag or heartbeat; experiments had no fixture_note. db/migrations/0003_api_storage.sql adds or relaxes exactly these. Jurors now get a row when the jury is asked.
- Runner.submit takes a JobRef (kind + row ID), not a generator, so a Postgres queue can store it. JobFactory turns refs into generators; services submit inside repo.locked()/transaction() so the jobs row commits with the change. Dock jobs are not in jobs: their dock_jobs row is the queue entry.
- Jobs must be idempotent (at-least-once): build_experiment and run_dock return early when already finished, save_build_result replaces rows, run_jury starts from the first juror.

## Watch out
- The archive/docking rule holds even without the app's SELECT ... FOR UPDATE: the 0003 triggers (experiments_archive_guard, dock_jobs_experiment_active, the insert share-locks the Experiment row) refuse it. Removing FOR UPDATE from PostgresRepo.locked() left the racing tests green; only tests/test_postgres.py::test_archive_waits_for_a_docking_request_in_flight_and_is_refused catches it.
- A UniqueViolation aborts the whole transaction. PostgresRepo.add_dock_job wraps its insert in conn.transaction() (a savepoint) so request_dock can catch DuplicateComputation and reuse the job that won.
- Pass None, never Jsonb(None), for a null jsonb column: JSON null is not SQL null and breaks the candidates network/unscorable_reason check.
