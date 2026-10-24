# Database

Postgres schema for saved Experiments, the Model jury, background jobs and
docking (plan.md section 9.3). Production runs on the Tiger Cloud service
`oxhack`; tests never touch it.

## Apply migrations

```sh
uv run db/migrate.py --dry-run   # list pending files
uv run db/migrate.py             # apply them (uses $DATABASE_URL)
```

Files in `migrations/` run in number order, each in its own transaction, and
are recorded in `schema_migrations` with a checksum. Never edit an applied
file; add the next number instead. A database that already holds `0001` from
before this script existed (the Tiger service) is detected and recorded
without running `0001` again.

## Run the tests

```sh
uv run --no-project --python 3.12 --with pytest --with "psycopg[binary]>=3.2,<4" pytest db/tests -q
```

The tests start a temporary Postgres cluster with the local `initdb` and
`pg_ctl`. Without those binaries (for example in the codespace), point
`TEST_DATABASE_URL` at a disposable server, such as
`docker run --rm -e POSTGRES_HOST_AUTH_METHOD=trust -p 5432:5432 postgres:16`
with `TEST_DATABASE_URL=postgresql://postgres@localhost:5432/postgres`.
Each test creates and drops its own database there.

## Rules the schema enforces

- Experiments are archived, never deleted: a trigger blocks `delete`, and
  child rows use `on delete restrict`.
- A failed Experiment, job, jury run or docking job must carry an error.
- At most one queued or running job of each kind per Experiment.
- One live docking computation per cache key; a repeat request reuses it.
