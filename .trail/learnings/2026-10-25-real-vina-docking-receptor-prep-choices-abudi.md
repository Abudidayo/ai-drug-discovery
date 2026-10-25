---
title: "Real Vina docking: receptor prep choices and the measured JAK2 controls"
author: Abudi
date: 2026-10-25
branch: abdullah-nextverse/workstream-c-docking
cost: { minutes: 63, tokens: 419641 }
id: l-14b52079
scope: repo
status: active
src: agent
touches:
  - worker/oxhack_worker/prepare.py
  - ".devcontainer/docking-requirements.in"
  - api/oxhack_api/services/docking.py
  - api/oxhack_api/jobs_pg.py
---

## Decided
- worker/oxhack_worker/prepare.py cuts side chains the crystal does not resolve back to ALA (CB present) or GLY instead of rebuilding them. Meeko 0.8.0's mk_prepare_receptor.py refuses any residue with missing heavy atoms (6WTO has 34, 6WTN 25), and inventing coordinates is worse than a stub for a "geometric hypothesis" tool. Every change is listed in structures/{PDB}/meta.json.
- PTR 1007/1008 in 6WTO and 6WTN are converted to TYR because they sit more than 20 A from the box centre; prepare.py refuses a modified residue inside the box.
- Redock control jobs get the ID uuid5(CONTROL_NAMESPACE, cache_key) (services/docking.py VinaDocking.control_job_id), so the API, the pipeline worker and the docking worker all seed the same queued row, and a new toolchain gets a new control.
- With OXHACK_DOCKING=vina the pipeline worker serves only the `jobs` queue (PostgresWorker queues=...); oxhack_worker.queue serves only `dock_jobs`. Otherwise both would claim docking jobs and the pipeline worker would fail them with "this process does not run docking jobs".

## Tried and ruled out
- PDBFixer (1.12.0, sdist only) addMissingAtoms with or without addMissingHydrogens: the rebuilt side chains (6WTO TYR 913, SER 1134, then 868, 879, 883, 926) had distorted geometry, so Meeko's proximity bonding saw extra bonds and refused them.
- `pip install vina` on macOS arm64: no wheel for 1.2.7, and the sdist build needs Boost ("Boost library location was not found"). Run the docking venv in a linux/amd64 container under Rosetta instead (worker/README.md has the command); results were identical on 4 and 18 CPUs.

## Watch out
- The measured controls (exhaustiveness 8, seed 42): 6WTO baricitinib 2.43 A and 6WTN ruxolitinib 2.83 A FAIL the 2.0 A threshold; 6O0K venetoclax 1.08 A and 7BQU thalidomide 0.41 A pass. In both JAK2 top poses the pyrrolopyrimidine is turned (pyrrole ring about 4 A off) while a 1.4-1.6 A pose ranks lower; exhaustiveness 16 and 32 do not change it. Do not tune settings until it passes; that would be overfitting the control.
- Meeko 0.8.0 imports scipy without declaring it; the lock now pins scipy==1.17.1, and without it `import meeko` fails.
- gemmi splits a chain whose ligands follow TER into two chains named A (7BQU): call structure.merge_chain_parts() before model["A"].
- The RCSB ModelServer ligand SDF has no V2000 tag or 3D code and per-request properties; prepare.py rewrites the header so files are deterministic and not read as 2D.
- 6O0K chain A maps to two UniProt accessions (BCL2 P10415 and BCL-XL Q07817): it is a chimeric construct; meta.json keeps both.
