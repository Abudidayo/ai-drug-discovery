# oxhack-api

The FastAPI service behind the web app: Disease search, Experiments and their
build progress, the Model jury, docking jobs, history (archive and restore) and
the evaluation results. `oxhack_api/schemas.py` is the single source of truth
for every request and response; `openapi.json` is generated from it and the
web app's TypeScript types are generated from that.

Today the API runs in **fixture mode**: Experiments, jury reviews, structures
and docking results come from `oxhack_api/fixtures/`. They are kept in memory
by default, or saved in Postgres with `OXHACK_REPO=postgres` (see below). The
live pipeline (phase 5), the live jury (phase 6) and the docking worker
(phase 7) plug into the same seams.

## Run

```sh
cd api
uv sync
uv run uvicorn oxhack_api.app:app --reload     # http://127.0.0.1:8000/docs
```

| Variable | Default | Meaning |
|---|---|---|
| `OXHACK_FIXTURE_DELAY_MS` | `400` | Pause between background job steps, so the UI can show progress. |
| `OXHACK_FIXTURES_DIR` | `oxhack_api/fixtures` | Folder holding the fixture files. |
| `OXHACK_WORKER_THREADS` | `4` | Threads that run background jobs, in the API or in the worker. |
| `OXHACK_REPO` | `memory` | `memory` (lost on restart) or `postgres`. |
| `OXHACK_DATABASE_URL` | none | Postgres connection string; required with `OXHACK_REPO=postgres`. |
| `OXHACK_DATABASE_POOL_SIZE` | `10` | Most Postgres connections one process opens. |
| `OXHACK_INPROCESS_WORKER` | `1` | With Postgres, also run the job worker inside the API. Set `0` when `python -m oxhack_api.worker` runs. |
| `OXHACK_WORKER_POLL_MS` | `1000` | How often an idle worker checks for jobs it was not notified about. |
| `OXHACK_JOB_HEARTBEAT_S` | `10` | How often a worker refreshes the heartbeat of the jobs it runs. |
| `OXHACK_JOB_STALE_AFTER_S` | `60` | A running job with an older heartbeat lost its worker and is re-queued. |
| `OXHACK_JOB_MAX_ATTEMPTS` | `3` | Claims of one job before a stale one is failed instead of re-queued. |

## Run against Postgres

The app never migrates the database; migrate it first. Never point tests or
local runs at the Tiger service. A throwaway local Postgres 16:

```sh
# From the repository root. Any free port works; 5433 avoids a system Postgres.
initdb -D /tmp/oxhack-pg -U postgres -A trust
pg_ctl -D /tmp/oxhack-pg -o "-p 5433 -c listen_addresses=localhost" -l /tmp/oxhack-pg/log -w start
createdb -h localhost -p 5433 -U postgres oxhack
DATABASE_URL=postgresql://postgres@localhost:5433/oxhack uv run db/migrate.py
```

Or with Docker: `docker run --rm -d --name oxhack-pg -e POSTGRES_HOST_AUTH_METHOD=trust
-p 5433:5432 postgres:16`, then the same `createdb` and `migrate.py` lines.

Then start the API on it:

```sh
cd api
OXHACK_REPO=postgres \
OXHACK_DATABASE_URL=postgresql://postgres@localhost:5433/oxhack \
uv run uvicorn oxhack_api.app:app --reload
```

Experiments, jury runs and docking jobs now survive a restart. The API refuses
to start on a database that is missing a migration, and says to run
`uv run db/migrate.py`. Stop the throwaway server with
`pg_ctl -D /tmp/oxhack-pg stop` and delete the folder.

## Background jobs

Building an Experiment, running the Model jury and docking are background
jobs. With the memory repo they run on threads inside the API. With Postgres
they are rows in a queue, written in the same transaction as the change that
needs them:

- **`jobs`** holds Experiment builds (`experiment_build`) and jury runs
  (`jury_run`); at most one queued or running job of each kind per Experiment.
- **`dock_jobs`**: each docking job's own row is its queue entry. A job that
  reuses an identical computation (`cached_from`) is not queued; it follows the
  job it reuses.

A worker claims the oldest queued row with `FOR UPDATE SKIP LOCKED`, so several
workers never take the same job, and Postgres `NOTIFY` wakes it when a job is
committed. By default the worker runs inside the API (`OXHACK_INPROCESS_WORKER=1`).
To run it as its own process, or several of them:

```sh
cd api
OXHACK_REPO=postgres OXHACK_DATABASE_URL=postgresql://postgres@localhost:5433/oxhack \
uv run python -m oxhack_api.worker      # stops on Ctrl-C or SIGTERM
```

and start the API with `OXHACK_INPROCESS_WORKER=0`.

Job states (both tables):

| State | Meaning |
|---|---|
| `queued` | Waiting for a worker. |
| `running` | Claimed: `attempts` went up by one, `started_at` and `heartbeat_at` are set. The worker writes `progress` (e.g. `{"stage": "ranking"}`, `{"jurors_done": 1, "jurors_total": 3}`) and the heartbeat after each step, and refreshes the heartbeat every `OXHACK_JOB_HEARTBEAT_S` while a step runs. |
| `done` | Finished. The Experiment, jury run or docking job holds the result. |
| `failed` | Finished with `error`, the same reason the Experiment, jury run or docking job shows. |

A `running` job whose heartbeat is older than `OXHACK_JOB_STALE_AFTER_S` lost
its worker. Workers put it back to `queued` when they start and then every
half of that period; after `OXHACK_JOB_MAX_ATTEMPTS` claims it is `failed`
instead, and so is its Experiment build, jury run or docking job. A worker that
is stopped between steps puts its job back at once. Jobs are safe to run again:
a rebuild replaces what an interrupted one left, and a jury run starts from the
first juror.

## Test and check

```sh
uv run pytest -q
uv run ruff check .
uv run ruff format --check .
uv run pyright
```

Every test that uses the API client runs twice: on the memory repo and on
Postgres, each time in a fresh migrated database cloned from a template.
`tests/test_postgres.py` adds what only Postgres has: restarts, the job queue,
`SKIP LOCKED`, stale jobs and races. The database comes from
`db/throwaway_pg.py` (shared with `db/tests`): a temporary cluster started
with the local `initdb` and `pg_ctl`, or the disposable server in
`TEST_DATABASE_URL`. Without either, the Postgres runs are skipped.

## Export the contract

```sh
uv run python -m oxhack_api.export_openapi    # writes api/openapi.json
```

Run it after any change to `schemas.py` or the routes, then commit
`openapi.json` and run `npm run gen:api` in `web/`. A test fails while the
committed file is stale. Keys are sorted, so the file only changes when the
contract does.

## Routes

All under `/api`. Errors are `{"detail": "..."}` in plain words; a request that
fails validation gets FastAPI's `{"detail": [...]}` list.

| Route | Result |
|---|---|
| `GET /health` | `ok`, the data source and the version |
| `GET /diseases/search?q=` | Diseases an Experiment can be built for |
| `POST /experiments` `{disease_id}` | **202**, the queued Experiment. Poll it: `queued`, then `building` (stages `targets`, `ranking`, `evidence`, `saving`), then `ready` or `failed` |
| `GET /experiments/{id}` | Disease, Targets, network, shortlist (at most 15 Candidates), jury and docking jobs |
| `GET /experiments?archived=&include_building=` | History, newest first. Only ready Experiments unless `include_building=true` |
| `POST /experiments/{id}/jury` | **202**, the queued jury run. Once per Experiment (409 on a repeat); refused while archived or not ready (409) |
| `POST /experiments/{id}/archive`, `/restore` | Hide from or return to history. Archive is refused while building or while a docking job is queued or running (409) |
| `GET /structures` | The prepared docking structures and their redocking controls |
| `POST /dock` `{experiment_id, candidate_id, structure_id}` | **202**, the docking job. An identical earlier computation is reused (`cached_from`). Unsupported pairs get 422 with the reason; archived Experiments 409 |
| `GET /dock/{id}` | Job status, scores and failures |
| `GET /evaluation` | Frozen evaluation metrics |

## Fixtures

`fixtures/MONDO_0100096/` holds the COVID-19 Experiment (`experiment.json`)
and its recorded jury run (`jury.json`); `structures.json`, `docking.json` and
`evaluation.json` are shared. Each file has a `fixture_note` saying which
values are made up.

**Real and checked on 2026-10-24/25:** Ensembl gene IDs (Ensembl REST
`lookup/symbol`, cross-checked with Open Targets `targets`), ChEMBL parent IDs
and mechanism records (ChEMBL `molecule` and `mechanism` APIs; every mechanism
record's parent equals its Candidate), PubChem CIDs (PUG REST by the ChEMBL
InChIKey), approvals and warnings (Open Targets 26.09 `drugs`), Disease Target
associations (Open Targets `associatedTargets`), network edges (STRING 12.5,
combined score at least 0.7, STRING proteins mapped to genes through Open
Targets `proteinIds`), the four structures (RCSB entry, entity and chemical
component APIs; the box centre is the crystal ligand's heavy-atom centroid)
and every evidence URL (each returned HTTP 200).

**Made up:** every score, rank, distance, z-score, pChEMBL median, activity
count, jury vote, latency, docking score and RMSD. The 9 Disease Targets are a
sample, not the real top 50. The 6WTO redock RMSD is a placeholder marked
`fixture: true`; the docking worker measures the real value.

Findings while checking:

- Camostat, nafamostat and fluvoxamine have no regulator-backed approval in
  Open Targets 26.09, so they are not Candidates. The prototype's nafamostat ID
  (`CHEMBL3989553`) is the mesylate salt; its parent is `CHEMBL273264`.
- ChEMBL parents deucravacitinib to cravacitinib (`CHEMBL4596392`), a different
  molecule, so it was left out, like the known deuruxolitinib link.
- STRING 12.5's CCR2 protein (`ENSP00000292301`) is not among Open Targets
  26.09's protein IDs for CCR2, so CCR2 is excluded with `not_in_graph`.
- Open Targets lists baricitinib for COVID-19 at phase 3, not approval;
  remdesivir is the only shortlisted drug with a COVID-19 approval there.
- 7BQU's ligand is (S)-thalidomide (`CHEMBL426123`), a different parent from
  thalidomide (`CHEMBL468`). 6O0K's chain is a BCL2 construct that RCSB also
  maps to BCL-XL (`Q07817`).
