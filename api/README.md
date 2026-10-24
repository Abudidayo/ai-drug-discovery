# oxhack-api

The FastAPI service behind the web app: Disease search, Experiments and their
build progress, the Model jury, docking jobs, history (archive and restore) and
the evaluation results. `oxhack_api/schemas.py` is the single source of truth
for every request and response; `openapi.json` is generated from it and the
web app's TypeScript types are generated from that.

Today the API runs in **fixture mode**: Experiments, jury reviews, structures
and docking results come from `oxhack_api/fixtures/`, and everything is kept in
memory. Postgres storage (phase 4), the live pipeline (phase 5), the live jury
(phase 6) and the docking worker (phase 7) plug into the same seams.

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
| `OXHACK_WORKER_THREADS` | `4` | Threads for in-process background jobs. |

## Test and check

```sh
uv run pytest -q
uv run ruff check .
uv run ruff format --check .
uv run pyright
```

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
