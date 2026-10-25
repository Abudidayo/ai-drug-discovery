#!/usr/bin/env bash
# Runs once when the codespace or dev container is created.
set -euo pipefail
cd "$(dirname "$0")/.."

sudo apt-get update
sudo apt-get install -y --no-install-recommends postgresql-client

# One uv workspace (root pyproject.toml): stream A's pipeline/ and jury/, api/
# and worker/, in one .venv with one uv.lock.
uv sync --all-packages

# Docking toolchain (docs/build-reference.md C1-C6), kept apart from the project
# venv: Vina has Linux x86_64 wheels only, so it cannot join the cross-platform
# uv.lock, and `uv sync` never removes it from here. The docking worker
# (worker/oxhack_worker/queue.py) runs it as a subprocess.
uv venv --allow-existing --python /usr/local/bin/python "$DOCKING_VENV"
uv pip install --python "$DOCKING_VENV/bin/python" -r .devcontainer/docking-requirements.txt

sudo mkdir -p "$RESULTS_DIR"
sudo chown "$(id -u):$(id -g)" "$RESULTS_DIR"

# The versions the worker will find; they must match worker/structures/settings.json.
PYTHONPATH=worker "$DOCKING_VENV/bin/python" -m oxhack_worker.dock --toolchain
