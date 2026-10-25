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

   `python` is the docking venv (`$DOCKING_VENV`). `uv run` uses the project venv once `pyproject.toml` exists. Docking results go to `$RESULTS_DIR` (`/workspaces/results`).
3. Make the API public:

   ```bash
   gh codespace ports visibility 8000:public -c <codespace name>
   ```

   The URL is `https://<codespace name>-8000.app.github.dev`.
4. Before judging:
   - pre-run the docking cache (build reference C9);
   - keep one browser tab attached to the codespace. It stops after 240 idle minutes, and only editor or terminal activity counts, not HTTP traffic;
   - stop the codespace afterwards to save hours.

## Change the docking packages

Edit `docking-requirements.in`, then regenerate `docking-requirements.txt` with the command at the top of the `.in` file.
