# Data-source test bench

A throwaway local server and page for pulling live data from the three public sources behind the evidence pipeline:

- **Open Targets**: disease search, linked proteins (targets) and drugs tested for a disease
- **ChEMBL**: each drug's development phase, mechanisms, safety warnings and tested uses
- **PubChem**: structure drawing, formula, weight and XLogP

It is for checking what the APIs return before building the real pipeline. It is not part of the app, and it saves nothing.

## Run it

Requires Node 18 or newer. There are no dependencies to install and no API keys: all three APIs are public.

```sh
node demos/data-sources/server.mjs
```

Open <http://127.0.0.1:8787>. Set `PORT` to use another port. The server only listens on this machine.

## Endpoints

Each endpoint returns `{ data, sources }`. `sources` lists every upstream call with its URL, HTTP status, time in milliseconds and any error. Add `raw=1` to also get the untouched upstream JSON.

| Endpoint | What it returns |
|---|---|
| [`/api/diseases?q=covid`](http://127.0.0.1:8787/api/diseases?q=covid) | Up to 10 matching diseases from Open Targets |
| [`/api/diseases/MONDO_0100096?targets=10&drugs=25`](http://127.0.0.1:8787/api/diseases/MONDO_0100096?targets=10&drugs=25) | The disease, its top targets by association score, and its drugs, most advanced clinical stage first |
| [`/api/drugs/CHEMBL2105759`](http://127.0.0.1:8787/api/drugs/CHEMBL2105759) | ChEMBL molecule, mechanisms, warnings and indications, plus PubChem properties |

PubChem is looked up by the InChIKey from ChEMBL, not by drug name, so the structure always matches the ChEMBL record. Drugs with no small-molecule structure, such as antibodies, skip PubChem and say so.

If one source fails, the others still return and the failed block explains which source failed and why. A request fails as a whole (HTTP 502) only when every source fails. To try the failure states, point a source at a host that does not exist:

```sh
PUBCHEM_BASE=https://invalid.example node demos/data-sources/server.mjs
```

`CHEMBL_BASE` and `OPEN_TARGETS_URL` work the same way.

## Known-answer check

Search **COVID-19** (`MONDO_0100096`), filter the drug list for **baricitinib** (`CHEMBL2105759`) and open it. As of 24 October 2026 the pipeline surfaces it with no help: Open Targets lists it among 540 drugs for COVID-19. ChEMBL shows 2 mechanisms (JAK1 and JAK2 inhibitor), 4 boxed warnings, 33 tested uses and PubChem CID 44205240.

## Reading the numbers

- **Open Targets association score** (0 to 1) reflects how much evidence exists for a protein-disease link. It is not a confidence or a chance of success.
- **"Stage for this disease"** comes from Open Targets and is the furthest a drug got for this disease. **"Highest phase"** comes from ChEMBL and covers any use. Both list baricitinib for COVID-19 at phase 3, even though the US FDA approved it for some hospitalised COVID-19 patients in 2022. These sources can lag behind regulators, so neither field alone shows whether a drug is approved for a disease.
- **No warnings** in ChEMBL means the safety status is unknown, not that the drug is safe.

## Limits

No caching, retries or rate-limit handling: fine for manual testing, not for load. Open Targets returns every drug for a disease in one response (a few hundred rows). The page filters them in the browser.
