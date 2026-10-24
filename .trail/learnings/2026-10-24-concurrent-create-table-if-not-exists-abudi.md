---
title: "Concurrent 'create table if not exists' races in Postgres; db/migrate.py locks first"
author: Abudi
date: 2026-10-24
branch: abdullah-nextverse/workstream-c
cost: { minutes: 19, tokens: 120928 }
id: l-d8e64313
scope: repo
status: active
src: agent
touches:
  - docs/design.md
  - db/README.md
  - db/migrate.py
  - db/migrations/0002_product.sql
  - db/tests/conftest.py
  - db/tests/test_migrations.py
  - ".env.example"
  - db/migrations/0001_initial.sql
  - ".devcontainer/Dockerfile"
  - ".devcontainer/README.md"
---

## Watch out
- Two `db/migrate.py` runs at once both executed `create table if not exists schema_migrations` and one failed with a unique violation on `pg_type_typname_nsp_index`. `if not exists` does not make concurrent DDL safe. migrate.py now takes a session-level `pg_advisory_lock` before reading or creating anything, and releases it in `finally`. `db/tests/test_migrations.py::test_concurrent_runs_apply_each_file_once` covers it.
- Loading `db/migrate.py` from tests with `importlib.util.spec_from_file_location` needs the module registered in `sys.modules` before `exec_module`, or its `@dataclass` crashes with "'NoneType' object has no attribute '__dict__'".
