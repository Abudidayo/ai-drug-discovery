# Dev container and demo codespace

This folder defines the environment that runs the whole stack: Python 3.11, uv, Node LTS, Docker, `psql`, and the docking toolchain (Vina, Meeko, RDKit, gemmi, PoseBusters). The shared demo host is a GitHub Codespace built from it. Account setup is in [build reference §1](../docs/build-reference.md#github-codespaces-stream-c).

## Team workflow

- **Local development:** everyone develops and tests their own feature locally. The container is optional there. It helps when Vina will not install on a Mac: in VS Code, run "Dev Containers: Reopen in Container". It runs as amd64, so on Apple Silicon first turn on Docker Desktop → Settings → General → "Use Rosetta for x86_64/amd64 emulation". Without Rosetta, the QEMU fallback crashes while installing uv.
- **Shared codespace:** the integration and demo host. Start it from `main` after merges and run the whole stack there.
- **One owner:** Abudi owns the demo codespace, because a codespace uses its creator's free hours (120 core-hours a month, about 30 hours on this 4-core machine).
- **Shared database:** everyone uses the same Tiger database. Tag test experiments, or give each developer a schema, so test runs stay out of the demo history.

## Use the demo codespace

1. Create it: GitHub → Code → Codespaces → Create, or

   ```bash
   gh codespace create -R Abudidayo/ai-drug-discovery -m standardLinux32gb
   ```

   `standardLinux32gb` is the 4-core, 16 GB machine.
2. Check it:

   ```bash
   psql "$DATABASE_URL" -c 'select 1'
   python -c "import vina, rdkit, meeko, gemmi"
   ```

   `python` is the docking venv (`$DOCKING_VENV`). `uv run` uses the project venv: one uv workspace (stream A's `pipeline/` and `jury/` plus `api/`), synced with `uv sync --all-packages`. Docking results go to `$RESULTS_DIR` (`/workspaces/results`).
3. Start the app and share it: `scripts/redeploy.sh` (it checks out `main`, migrates the database, builds the web app and starts everything), then make the web app public. The web app reaches the API inside the codespace, so the API port stays private.

   ```bash
   gh codespace ports visibility 5173:public -c <codespace name>
   ```

   The URL is `https://<codespace name>-5173.app.github.dev`. Visitors see GitHub's "development port" warning once per browser session, then the app.
4. Before judging:
   - pre-run the docking cache (build reference C9);
   - keep one browser tab attached to the codespace. It stops after 240 idle minutes, and only editor or terminal activity counts, not HTTP traffic;
   - stop the codespace afterwards to save hours.

## Deploy

Every push to `main` deploys: the Deploy workflow (`.github/workflows/deploy.yml`) runs the tests, then opens a shell in the codespace and runs `scripts/redeploy.sh main`, then checks the public link answers. Runs appear under Actions and the repository's **demo** environment; Actions → Deploy → Run workflow deploys by hand. It needs, in Settings → Secrets and variables → Actions:

- secret `CODESPACE_DEPLOY_TOKEN`: a classic personal access token of the codespace's owner with the `codespace` scope;
- variable `DEMO_CODESPACE`: the codespace's name (`gh codespace list`);
- variable `DEMO_URL`: its public web address, ending in `/`.

A stopped codespace is started by the deploy. The workflow doesn't keep it awake: see "Before judging".

## Change the docking packages

Edit `docking-requirements.in`, then regenerate `docking-requirements.txt` with the command at the top of the `.in` file.
