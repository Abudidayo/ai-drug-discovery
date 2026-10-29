#!/usr/bin/env bash
# Runs once when the codespace or dev container is created.
set -euo pipefail
cd "$(dirname "$0")/.."

sudo apt-get update
sudo apt-get install -y --no-install-recommends postgresql-client

# One uv workspace (root pyproject.toml): core/ (pipeline and jury), app/api/
# and app/worker/, in one .venv with one uv.lock.
uv sync --all-packages

# Docking toolchain (docs/engineering/build-reference.md C1-C6), kept apart from the project
# venv: Vina has Linux x86_64 wheels only, so it cannot join the cross-platform
# uv.lock, and `uv sync` never removes it from here. The docking worker
# (app/worker/oxhack_worker/queue.py) runs it as a subprocess.
uv venv --allow-existing --python /usr/local/bin/python "$DOCKING_VENV"
uv pip install --python "$DOCKING_VENV/bin/python" -r .devcontainer/docking-requirements.txt

# remoteEnv puts the venv first, but login shells re-prepend the image's
# Python in /etc/profile.d, so put it first again in interactive shells.
for rc in ~/.bashrc ~/.zshrc; do
  grep -qs 'DOCKING_VENV/bin' "$rc" || echo 'export PATH="$DOCKING_VENV/bin:$PATH"' >> "$rc"
done

sudo mkdir -p "$RESULTS_DIR"
sudo chown "$(id -u):$(id -g)" "$RESULTS_DIR"

# The versions the worker will find; they must match app/worker/structures/settings.json.
PYTHONPATH=app/worker "$DOCKING_VENV/bin/python" -m oxhack_worker.dock --toolchain
